# bs-table

## Options

### `classes` (Type: `string | object`, Default: `'table'`)

Defines the CSS classes applied to the table.
- If a `string` is provided, it is directly added as a class to the table.
- If an `object` is provided, more specific classes can be applied to individual table elements.

Example:  
```json  
{  
  "table": "table align-top table-sm table-bordered table-primary mb-0",  
  "thead": "table-dark h4 text-uppercase",  
  "tbody": "table-group-divider",  
  "tfoot": "table-warning"  
}  
```

---  

### `toolbar` (Type: `string | $`, Default: `null`)

Specifies a selector or a jQuery object that is moved to the top of the table.

---  

### `pagination` (Type: `boolean`, Default: `true`)

If set to `true`, the table includes pagination controls.  
If set to `false`, no pagination will be used.
When enabled, parameters such as `limit` and `offset` are included in server requests.

---  

### `sidePagination` (Type: `string`, Default: `'client'`)

Determines where pagination should occur.
- Possible values:
    - `'client'`: Assumes all data is available locally.
    - `'server'`: Pagination is based on the server's response in the format `{rows: [], total: 0}`.

---  

### `paginationVAlign` (Type: `string`, Default: `'bottom'`)

Specifies the vertical alignment of pagination controls:
- Values: `'top'`, `'bottom'`, or `'both'`.

---  

### `paginationHAlign` (Type: `string`, Default: `'end'`)

Specifies the horizontal alignment of pagination controls:
- Values: `'start'` (left) or `'end'` (right).

---  

### `pageNumber` (Type: `number`, Default: `1`)

Defines the default initial page number at which the table should be loaded.

---  

### `pageSize` (Type: `number`, Default: `10`)

Defines how many rows should be displayed on a single page.

---  

### `pageList` (Type: `array<number>`, Default: `[5, 10, 25, 50, 100, 200, 'All']`)

Provides an array of page size options that users can select from to change the number of displayed rows per page.

---  

### `search` (Type: `boolean`, Default: `true`)

Enables or disables the search bar above the table.  
When enabled, search parameters are included in server requests as the `search` attribute.

---  

### `sortName` (Type: `string`, Default: `null`)

Defines the column by which the table content should be initially sorted.

---  

### `sortOrder` (Type: `string`, Default: `'asc'`)

Specifies the default sorting order for the table.
- Possible values:
    - `'asc'`: Ascending order.
    - `'desc'`: Descending order.  
