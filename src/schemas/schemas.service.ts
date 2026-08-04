import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ColumnMetadata } from 'typeorm/metadata/ColumnMetadata';
import { TABLES_META } from './schemas.data.js';

export type SchemaColumn = {
  column: string;
  type: string;
  nullable: string;
  default: string;
  description: string;
  isPrimary: boolean;
};

export type SchemaTable = {
  table: string;
  description: string;
  columns: SchemaColumn[];
  createSql?: string;
  alterSql?: string;
};

@Injectable()
export class SchemasService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getSchemas(): Promise<SchemaTable[]> {
    return this.dataSource.entityMetadatas
      .filter((meta) => !TABLES_META[meta.tableName] || TABLES_META[meta.tableName])
      .map((meta) => {
        const tableMeta = TABLES_META[meta.tableName];
        return {
          table: meta.tableName,
          description: tableMeta?.description || '',
          columns: meta.columns
            .filter((col) => !col.relationMetadata || col.isPrimary)
            .map((col) => this.mapColumn(col, tableMeta?.columns)),
          createSql: tableMeta?.createSql,
          alterSql: tableMeta?.alterSql,
        };
      })
      .sort((a, b) => a.table.localeCompare(b.table));
  }

  private mapColumn(
    col: ColumnMetadata,
    columnMeta?: Record<string, { description: string }>,
  ): SchemaColumn {
    return {
      column: col.databaseName,
      type: this.resolveType(col),
      nullable: col.isNullable ? 'YES' : 'NO',
      default: this.resolveDefault(col),
      description: columnMeta?.[col.propertyName]?.description || '',
      isPrimary: col.isPrimary,
    };
  }

  private resolveType(col: ColumnMetadata): string {
    const type = col.type;
    if (typeof type === 'string') {
      let result = type;
      if (col.length && !['uuid'].includes(type)) {
        result += `(${col.length})`;
      } else if (
        ['decimal', 'double', 'float'].includes(type) &&
        col.precision !== undefined
      ) {
        result += `(${col.precision}, ${col.scale ?? 0})`;
      }
      return result;
    }

    if (type === String) {
      return col.length ? `varchar(${col.length})` : 'character varying';
    }
    if (type === Number) return 'integer';
    if (type === Boolean) return 'boolean';
    if (type === Date) return 'timestamp';

    if (col.generationStrategy === 'uuid') return 'uuid';
    if (typeof type === 'function') return type.name.toLowerCase();
    return 'unknown';
  }

  private resolveDefault(col: ColumnMetadata): string {
    if (col.default === undefined || col.default === null) return '-';
    if (typeof col.default === 'string') return col.default;
    if (typeof col.default === 'number') return String(col.default);
    if (typeof col.default === 'boolean') return col.default ? 'true' : 'false';
    if (col.default instanceof Function) {
      const name = col.default.name || 'fn';
      return name === 'uuid_generate_v4' || name === 'gen_random_uuid'
        ? 'gen_random_uuid()'
        : `${name}()`;
    }
    return String(col.default);
  }
}
