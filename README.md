# bs-table

A lightweight and user-friendly table plugin for Bootstrap, designed to efficiently manage tables in a streamlined, Bootstrap-themed web environment.
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

---

### `showRefresh` (Type: `boolean`, Default: `true`)

Displays a refresh button above the table, allowing the user to reload the data.

---  

### `showHeader` (Type: `boolean`, Default: `true`)

Controls the visibility of the table's `thead`.

- `true`: Display the table header.
- `false`: Hide the table header.

---  

### `showFooter` (Type: `boolean`, Default: `false`)

Controls the visibility of the table's `tfoot`.

- `true`: Display the table footer.
- `false`: Hide the table footer.

---  

### showColumns (Type: `boolean`, Default: `false`)

If the option is activated, a dropdown will be created where you can show and hide columns.

---

### minimumCountColumns  (Type: `number`, Default: `1`)

If `showColumns` is activated, you can control how many columns should remain visible at a minimum.

---

### `url` (Type: `string | function`, Default: `null`)

Defines the source for fetching the table's data.

- If a `string` is provided, it is treated as the endpoint for server requests.
- If a `function` is provided, it should return a `Promise` with the data.

The `url` is only used if the table is not provided with a `data` attribute.

--- 

### `data` (Type: `array`, Default: `null`)

Defines the local data that should be used to populate the table.

- If set, the table will use the data array directly without making server requests.
- The array should consist of objects, where each object represents a row in the table.

Example:

```json  
[
  {
    "id": 1,
    "title": "Example Title",
    "body": "Example Body"
  },
  {
    "id": 2,
    "title": "Another Title",
    "body": "Another Body"
  }
]  
```  

---

### `columns` (Type: `array`, Default: `[]`)

Defines the structure and behavior of the table's columns. Each element in the array represents a column and can include
various configuration options.

#### Example:

```javascript  
columns: [
    {
        field: 'id',
        title: 'ID',
        sortable: true,
        align: 'center',
        valign: 'middle'
    },
    {
        field: 'title',
        title: 'Title',
        sortable: true
    },
    {
        field: 'body',
        title: 'Description',
        sortable: true
    }
]  
```

#### Common Column Options:

- **`field`**: The key in the data object to display in this column.
- **`title`**: The header text of the column.
- **`sortable`**: Whether the column can be sorted (`true` or `false`).
- **`align`**: Sets horizontal alignment (`'left'`, `'center'`, or `'right'`).
- **`halign`**: Sets horizontal alignment for the header (`'left'`, `'center'`, or `'right'`).
- **`falign`**: Sets horizontal alignment for the footer (`'left'`, `'center'`, or `'right'`).
- **`valign`**: Sets vertical alignment (`'top'`, `'middle'`, or `'bottom'`).
- **`formatter`**: A custom function to format the cell values.
    - **Parameters**:
        1. **`value`** (*any*): The value of the cell for the current row.
        2. **`row`** (*object*): The full data object for the current row.
        3. **`index`** (*number*): The index of the current row.
        4. **`$td`** (*object*, optional): The jQuery element of the cell's `<td>` (if applicable).
    - **Examples**:
        - **Uppercase Conversion**:
          ```javascript
          formatter: function(value) {
            return value.toUpperCase();
          }
          ```
        - **Custom Badge**:
          ```javascript
          formatter: function(value) {
            return `<span class="badge bg-success">$${value}</span>`;
          }
          ```
        - **Combining Fields**:
          ```javascript
          formatter: function(value, row) {
            return `${row.title}: ${row.body}`;
          }
          ```
- **`visible`**: Whether the column should be initially visible.
- **`checkbox`**: Displays a checkbox in the column.
- **`radio`**: Displays a radio in the column.
- **`width`**: Defines the width of the column.

---

### **`idField`** (Type: `string`, Default: `null`)

The `idField` defines the unique identifier of each record in the table's data set. This is especially useful for
operations like row selection, updates, or deletions, where identifying a specific row is required.

#### Usage:

The value of `idField` corresponds to the key in the data objects that contains the unique identifier. If defined, this
field is used internally by the table for identifying rows and managing state.

#### Example 1: Setting a Unique Identifier

```javascript
idField: 'id'
```

**Data Example:**

```javascript
[
    {id: 1, title: "First Record", body: "This is the first record."},
    {id: 2, title: "Second Record", body: "This is the second record."}
]
```

#### Example 2: Using `idField` with Checkbox Selection

When using features like checkboxes or radios (e.g., `checkbox: true` in columns), the table may rely on `idField` to
distinguish which rows are selected or manipulated.

```javascript
const options = {
    idField: 'id', // Unique row identifier
    columns: [
        {
            checkbox: true // Enables row selection via checkboxes
        },
        {
            visible:false,
            field: 'id',
        },
        {
            field: 'title',
            title: 'Title'
        }
    ]
};
```

---

### **`icons`** (Type: `object`, Default: see below)

The `icons` configuration is used to define the Bootstrap Icons (or custom icons) applied to various UI elements within
the table, such as sorting, pagination, search, and refresh buttons.

#### Default Configuration:

```javascript
icons: {
    sortAsc: 'bi bi-caret-down-fill text-primary',   // Icon for ascending sort
        sortDesc
:
    'bi bi-caret-up-fill text-primary',    // Icon for descending sort
        sortNone
:
    'bi bi-caret-down',                    // Icon when sorting is disabled
        refresh
:
    'bi bi-arrow-clockwise',               // Icon for refresh button
        search
:
    'bi bi-search',                         // Icon for the search input field
        paginationNext
:
    'bi bi-chevron-right',          // Icon for the "Next" button in pagination
        paginationprev
:
    'bi bi-chevron-left'            // Icon for the "Previous" button in pagination
}
```

#### Customizing Icons:

You can override these default values to use your own icons or other icon libraries.

---

### **`caption`** (Type: `string` or `object`, Default: `null`)

The `caption` property defines a title or brief description for the table. It can be set as a simple string or a
configuration object to customize its appearance and position.

#### **Usage Modes:**

1. **As a String:**
   If `caption` is provided as a string, the string will directly be used as the caption text.

2. **As an Object:**
   When given as an object, it allows additional customization such as positioning and styling.

#### **Options When Using as an Object:**

- **`text`**: (`string`) The text to display as the caption.
- **`onTop`**: (`boolean`) Specifies whether to display the caption above or below the table. Defaults to `false` (below
  the table).
- **`classes`**: (`string`) CSS classes to apply to the caption element for styling.

#### **Examples:**

1. **Simple Caption (String):**

```javascript
caption: "Basic Table Caption"
```

This will render a caption below the table with the text "Basic Table Caption."

2. **Advanced Caption (Object):**

```javascript
caption: {
    text: "Advanced Table Caption",  // The caption text
        onTop
:
    true,                      // Display above the table
        classes
:
    "text-center text-success" // Custom styling with classes
}
```

This will display the caption above the table with the text "Advanced Table Caption," styled as centered green text.

#### **Behavior:**

- If `caption` is **a string**, the text is directly used without styling or positioning customizations.
- If `caption` is set to `null`, no caption will be displayed.
- If `onTop` is `true` (when using an object), the `caption-top` Bootstrap class is applied to position the caption
  above the table.

---

## events

### Event Overview Table for `bsTable`

This table includes the mapping between the `onX` callback functions and their corresponding global events in the
`bsTable` lifecycle:

| Event Name      | Global Event            | Parameters               | Description                                                                                                                  |
|-----------------|-------------------------|--------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `onAll`         | `all.bs.table`          | `eventName, ...args`     | A global event callback that listens to all events fired by the table. The `eventName` identifies the event being triggered. |
| `onLoadSuccess` | `load-success.bs.table` | None                     | Triggered when data is successfully loaded into the table.                                                                   |
| `onLoadError`   | `load-error.bs.table`   | None                     | Triggered when there is an error while loading data into the table.                                                          |
| `onPreBody`     | `pre-body.bs.table`     | `rows, $table`           | Fires before the table body is rendered. Useful for manipulating or preparing data before display.                           |
| `onPostBody`    | `post-body.bs.table`    | `rows, $table`           | Fires after the table body is rendered. Can be used for additional DOM manipulations or enhancements.                        |
| `onPostFooter`  | `post-footer.bs.table`  | `$tfoot, $table`         | Triggered once the footer is rendered.                                                                                       |
| `onRefresh`     | `refresh.bs.table`      | `params`                 | Triggered when the table is refreshed. Includes the parameters of the refresh request.                                       |
| `onSort`        | `sort.bs.table`         | `name, order`            | Called when a column is sorted. The `name` parameter defines the column field, and `order` specifies the sort direction.     |
| `onClickCell`   | `click-cell.bs.table`   | `field, value, row, $td` | Fired when a cell is clicked. Provides field name, its value, the data row, and the clicked cell element.                    |
| `onClickRow`    | `click-row.bs.table`    | `row, $tr, field`        | Triggered when a row is clicked. Provides the row data, the table row element, and the field of the clicked cell.            |
| `onCheck`       | `check.bs.table`        | `row, $input`            | Called when a row is checked. Provides the row data and the related checkbox input element.                                  |
| `onCheckAll`    | `check-all.bs.table`    | None                     | Fires when all rows are checked.                                                                                             |
| `onUncheck`     | `uncheck.bs.table`      | `row, $input`            | Triggered when a row is unchecked. Provides the row data and the related checkbox input element.                             |
| `onUncheckAll`  | `uncheck-all.bs.table`  | None                     | Fires when all rows are unchecked.                                                                                           |

---

#### Notes:

- **Global Event Handling**: Use global events (`*.bs.table`) to externally capture and handle specific events.
- **Mapped Event**: The `onX` callbacks and their corresponding global events always fire synchronously for the same
  actions.
- **Central Listener**: The `onAll` callback or the `all.bs.table` global event can serve as a single point of entry,
  covering all table events with `eventName` to differentiate actions.

This structure provides a complete overview of available callbacks, parameters, and external event mappings in `bsTable`
.oth `onAll` and `all.bs.table`, developers have a flexible approach to handle events internally or externally,
depending on project design. Both mechanisms simplify the process of managing and debugging events across the lifecycle
of the table while maintaining a consistent parameter format.hods allow full access to the event name and its associated
data. They can be used independently or together, depending on the use case. The `onAll` callback is defined internally
in the configuration, while `all.bs.table` provides an external, event-driven approach.
