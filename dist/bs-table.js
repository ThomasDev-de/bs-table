(function ($) {
    "use strict";

    $.bsTable = {
        version: '1.0.2',
        globalEventsBound: false,
        setDefaults(options) {
            this.defaults = $.extend(true, {}, this.defaults, options || {});
        },
        getDefaults() {
            return this.defaults;
        },
        getColumnDefaults() {
            return this.columnDefaults;
        },
        getCheckItemsConfigDefaults() {
            return this.checkItemsConfigDefaults;
        },
        defaults: {
            height: undefined,
            ajaxOptions: undefined,
            classes: 'table',
            toolbar: undefined,
            pagination: false,
            sidePagination: 'client',
            paginationVAlign: 'bottom',
            paginationHAlign: 'end',
            pageNumber: 1,
            pageSize: 10,
            pageList: [5, 10, 25, 50, 100, 200, 'All'],
            search: false,
            sortName: null,
            sortOrder: 'asc',
            showButtonRefresh: false,
            showHeader: true,
            showFooter: false,
            showButtonToggleColumns: false,
            showButtonColumnsChooser: false,
            showCheckItems: false,
            checkItemsConfig: {},
            cardView: false,
            detailView: false,
            showButtonCustomView: false,
            customView: false,
            onCustomView(_rows, _$td) {
            },
            idField: undefined,
            url: null,
            data: null,
            columns: [],
            minimumCountColumns: 1,
            icons: {
                sortAsc: 'bi bi-chevron-down text-primary',
                sortDesc: 'bi bi-chevron-up text-primary',
                sortNone: 'bi bi-chevron-expand',
                refresh: 'bi bi-arrow-clockwise',
                search: 'bi bi-search',
                paginationNext: 'bi bi-chevron-right',
                paginationPrev: 'bi bi-chevron-left',
                toggleOff: 'bi bi-toggle-off',
                toggleOn: 'bi bi-toggle-on',
                customViewOff: 'bi bi-columns-gap',
                customViewOn: 'bi bi-table',
                checkAll: 'bi bi-check-square-fill fw-bold',
                check: 'bi bi-check-square fw-bold',
                uncheckAll: 'bi bi-square fw-bold',
                uncheck: 'bi bi-square fw-bold',
                expand: 'bi bi-chevron-down',
                collapse: 'bi bi-chevron-up',
            },
            caption: null,
            rowStyle(_row, _index, _$tr) {
            },
            queryParams(_params) {
                return _params;
            },
            responseHandler(_res) {
                return _res;
            },
            onAll(_eventName, ..._args) {
            },
            onError(_message) {
            },
            onExpandRow(_index, _row, _$tr) {
            },
            onCollapseRow(_index, _row, _$tr) {
            },
            onLoadSuccess() {
            },
            onLoadError() {
            },
            onPreBody(_rows, _$table) {
            },
            onPostHeader(_$thead, _$table) {
            },
            onPostBody(_rows, _$table) {
            },
            onPostFooter(_$tfoot, _$table) {
            },
            onRefresh(_params) {
            },
            onSort(_name, _order) {
            },
            onClickCell(_field, _value, _row, _$td) {
            },
            onClickRow(_row, _$tr, _field) {
            },
            onCheck(_row, _$input) {
            },
            onCheckAll() {
            },
            onUncheck(_row, _$input) {
            },
            onUncheckAll() {
            },
            formatNoMatches() {
                return `<i class="bi bi-x-lg fs-1 text-danger"></i>`;
            },
            formatSearch() {
                return `...`
            },
            formatShowingRows(_pageFrom, _pageTo, _totalRows) {
                return `Showing ${_pageFrom} to ${_pageTo} of ${_totalRows} rows`;
            },
            formatRecordsPerPage() {
                return `records per page`;
            },
            debug: false
        },
        columnDefaults: {
            class: undefined,
            field: undefined,
            sortable: false,
            visible: true,
            width: undefined,
            valign: 'top',
            align: 'left',
            halign: 'start',
            falign: 'start',
            formatter: undefined,
            footerFormatter: undefined,
            headerFormatter: undefined,
            events: undefined
        },
        checkItemsConfigDefaults: {
            type: 'checkbox',          // Type: 'checkbox' or 'radio'
            name: 'btSelectItem',      // Base name for the input(s)
            field: 'checkItems',       // Associated field in table data
            clickRowToSelect: false,   // Whether clicking the row also selects the item
            align: 'center',           // Horizontal alignment for cell
            valign: 'top',             // Vertical alignment for cell
            position: 'start',         // Position of the check items in the row ('start' or 'end')
            width: 35,                 // A fixed width
            visible: true              // Show or hide the Checkitem
        },
        detailViewDefaults: {
            align: 'center',
            valign: 'top',
            position: 'start',
            width: 35,
            visible: true,
            clickRowToToggle: false,
            field: 'option',
            formatter: undefined,
        },
        utils: {
            getUniqueId(prefix = "bs_table_wrapper_") {
                const randomId = Math.random().toString(36).substring(2, 10);
                return prefix + randomId;
            },
            sortArrayByField(data, field, order = "ASC") {
                // Sicherstellen, dass die Reihenfolge korrekt ist
                const direction = order.toUpperCase() === "DESC" ? -1 : 1;

                return data.sort((a, b) => {
                    // NULL-Werte nach hinten sortieren
                    if (a[field] == null && b[field] == null) {
                        return 0;
                    } // Beide NULL
                    if (a[field] == null) {
                        return 1 * direction;
                    } // `a` ist NULL → `b` vorher
                    if (b[field] == null) {
                        return -1 * direction;
                    } // `b` ist NULL → `a` vorher

                    // Zahlen- oder Stringvergleich
                    const aValue = typeof a[field] === "number" ? a[field] : a[field].toString().toLowerCase();
                    const bValue = typeof b[field] === "number" ? b[field] : b[field].toString().toLowerCase();

                    if (aValue > bValue) {
                        return 1 * direction;
                    }
                    if (aValue < bValue) {
                        return -1 * direction;
                    }

                    // Alles gleich: Reihenfolge beibehalten
                    return 0;
                });
            }, calculateVisiblePagesOnNavigation(totalPages, currentPage) {
                const visiblePages = [];

                // Fall 1: Aktuelle Seite ist in den ersten 4 Seiten
                if (currentPage <= 4) {
                    for (let i = 1; i <= Math.min(5, totalPages); i++) {
                        visiblePages.push(i); // Zeige die ersten 5 Seiten
                    }
                    if (totalPages > 5) {
                        visiblePages.push("..."); // Platzhalter zu den restlichen Seiten
                        visiblePages.push(totalPages); // Zeige die letzte Seite
                    }
                }
                // Fall 2: Aktuelle Seite ist in den letzten 4 Seiten
                else if (currentPage >= totalPages - 3) {
                    visiblePages.push(1); // Zeige die erste Seite
                    if (totalPages > 5) {
                        visiblePages.push("..."); // Platzhalter zu den vorherigen Seiten
                    }
                    for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
                        visiblePages.push(i); // Zeige die letzten 5 Seiten
                    }
                }
                // Fall 3: Aktuelle Seite ist irgendwo in der Mitte
                else {
                    visiblePages.push(1); // Zeige die erste Seite
                    visiblePages.push("..."); // Platzhalter zu den vorherigen Seiten
                    visiblePages.push(currentPage - 1); // Eine Seite links von der aktuellen
                    visiblePages.push(currentPage); // Die aktuelle Seite
                    visiblePages.push(currentPage + 1); // Eine Seite rechts von der aktuellen
                    visiblePages.push("..."); // Platzhalter zu den nächsten Seiten
                    visiblePages.push(totalPages); // Zeige die letzte Seite
                }

                return visiblePages;
            },
            executeFunction(functionOrName, ...args) {
                if (!functionOrName) {
                    // console.warn('No functional name or functional reference!');
                    return undefined;
                }

                let func;

                if (typeof functionOrName === 'function') {
                    func = functionOrName;
                } else if (typeof functionOrName === 'string') {
                    if (typeof window !== 'undefined' && typeof window[functionOrName] === 'function') {
                        func = window[functionOrName];
                    } else {
                        console.error(`Die Funktion "${functionOrName}" konnte nicht im globalen Kontext gefunden werden.`);
                        return undefined;
                    }
                }

                if (!func) {
                    console.error(`Ungültige Funktion oder Name: "${functionOrName}"`);
                    return undefined;
                }

                return func(...args);
            },
            isValueEmpty(value) {
                if (value === null || typeof value === 'undefined') {
                    return true; // Null or undefined
                }
                if (Array.isArray(value)) {
                    return value.length === 0; // Empty array
                }
                if (typeof value === 'string') {
                    return value.trim().length === 0; // Empty string (including only spaces)
                }
                return false; // All other values are considered non-empty (including numbers)
            }
        }
    };

    /**
     * Namespace representing the base selector for Bootstrap's table component.
     *
     * The `.bs.table` namespace is typically used to tie JavaScript behavior to
     * Bootstrap-styled table elements in a consistent manner. It can act as a
     * unique identifier for applying styles, interactions, or functionality to
     * tables following the Bootstrap framework conventions.
     *
     * This namespace can serve as a convention for segregating table-related
     * functionalities to avoid conflicts and maintain readability in your code.
     */
    const namespace = '.bs.table';

    /**
     * An object containing CSS class names used for styling and structuring different elements of a Bootstrap-based table component.
     *
     * @property {string} wrapper - Overall wrapper class for the table component.
     * @property {string} wrapperResponsive - Class used for the responsive wrapper variant.
     * @property {string} overlay - Class applied to the visual loading overlay or spinner.
     * @property {string} topContainer - Class for the container located above the table.
     * @property {string} bottomContainer - Class for the container located below the table.
     * @property {string} search - Class used for wrapping the search field.
     * @property {string} searchInput - Class applied to the search input field.
     * @property {string} buttons - Class for the container holding buttons in the top container.
     * @property {string} btnRefresh - Class used for the refresh button.
     * @property {string} btnToggle - Class for the button that toggles the table view.
     * @property {string} btnCustomView - Class used for the button enabling a custom view mode.
     * @property {string} toolbar - Class for the toolbar container associated with the table.
     * @property {string} pagination - Class used for the container wrapping pagination controls.
     * @property {string} paginationDetails - Class wrapping detailed pagination information.
     * @property {string} wrapperSelection - Class for the wrapper that manages selection states or related elements.
     * @property {string} checkIcon - Class used for the check icon.
     */
    const bsTableClasses = {
        wrapper: 'bs-table', // Overall wrapper class
        wrapperResponsive: 'bs-table-responsive', // Responsive wrapper variant
        overlay: 'bs-table-overlay', // For the visual loading overlay/spinner
        topContainer: 'bs-table-top-container', // The container above the table
        bottomContainer: 'bs-table-bottom-container', // The container below the table
        search: 'bs-table-search', // Wrapper for the search field
        searchInput: 'bs-table-search-input', // The search input field
        buttons: 'bs-table-buttons', // Container for the buttons in the top container
        btnRefresh: 'bs-table-btn-refresh', // Refresh button
        btnToggle: 'bs-table-btn-toggle-view', // Button to toggle table view
        btnCustomView: 'bs-table-btn-custom-view', // Button for the custom view mode
        toolbar: 'bs-table-toolbar', // Toolbar container
        pagination: 'bs-table-pagination', // Wrapper for the pagination controls
        paginationDetails: 'bs-table-pagination-details', // Wrapper for detailed pagination information
        wrapperSelection: 'bs-table-selection', // Wrapper for detailed pagination information
        checkIcon: 'bs-table-icon'
    };

    /**
     * Object containing methods for table manipulation and state management.
     */
    const methods = {
        /**
         * Refreshes the table options and settings based on the provided configuration.
         *
         * @param {jQuery} $table The jQuery object is representing the table to be refreshed.
         * @param {Object} settings The new settings to be applied to the table.
         * @return {void} This method does not return a value.
         */
        refreshOptions($table, settings) {
            const setup = getSettings($table);
            const newSettings = $.extend(true, {}, setup, settings || {});
            const customView = newSettings.customView === true;
            const cardView = !customView && newSettings.cardView === true;
            setToggleCustomView($table, customView);
            setToggleView($table, cardView);
            setSettings($table, newSettings);
            makeSettingsValid($table);
            refresh($table);
        },
        /**
         * Hides a specific row in the given table by its index.
         *
         * @param {jQuery} $table - The jQuery object representing the table containing the row to hide.
         * @param {number} rowIndex - The index of the row to hide, as identified by the `data-index` attribute.
         * @return {void} This method does not return a value.
         */
        hideRowByIndex($table, rowIndex) {
            $($table).children('tbody').children(`tr[data-index="${rowIndex}"]:not(.d-none)`).addClass('d-none');
        },
        /**
         * Retrieves the list of hidden columns for the provided table.
         *
         * @param {jQuery} $table - The table element or table configuration object.
         * @return {Array<string>} An array of field names representing the hidden columns.
         */
        getHiddenColumns($table) {
            const settings = getSettings($table);
            const hiddenColumns = [];
            settings.columns.forEach(column => {
                if (column.visible === false) {
                    hiddenColumns.push(column.field);
                }
            });
            return hiddenColumns;
        },
        /**
         * Retrieves the visible columns for the provided table.
         *
         * @param {jQuery} $table - The table element or reference for which visible columns need to be determined.
         * @return {Array<string>} A list of field names for the columns that are marked as visible and are neither checkboxes nor radio buttons.
         */
        getVisibleColumns($table) {
            const settings = getSettings($table);
            const visibleColumns = [];
            settings.columns.forEach(column => {
                if (column.visible === true) {
                    visibleColumns.push(column.field);
                }
            });
            return visibleColumns;
        },
        /**
         * Displays a row in the table that was previously hidden by removing the 'd-none' class.
         *
         * @param {jQuery} $table - A jQuery object representing the table element.
         * @param {number|string} rowIndex - The index of the row to show, which corresponds to the value of the 'data-index' attribute.
         * @return {void} This method does not return a value.
         */
        showRowByIndex($table, rowIndex) {
            $($table).children('tbody').children(`tr[data-index="${rowIndex}"].d-none`).removeClass('d-none');
        },
        /**
         * Retrieves the current scroll position of the specified table's wrapper element.
         *
         * @param {jQuery} $table - A jQuery-wrapped table element whose scroll position is to be determined.
         * @return {Object} An object containing the x and y scroll positions.
         *                  - x {number}: The horizontal scroll position.
         *                  - y {number}: The vertical scroll position.
         */
        getScrollPosition($table) {
            const $wrapper = getResponsiveWrapper($table);
            return {
                x: $($wrapper).scrollLeft(), y: $($wrapper).scrollTop()
            };
        },
        /**
         * Displays a loading overlay over the specified table element.
         *
         * @param {HTMLElement|jQuery} $table - The table element over which the loading overlay should be displayed.
         * @return {void} This method does not return any value.
         */
        showLoading($table) {
            const wrapper = getWrapper($table);
            // Vorhandenes Overlay entfernen, falls vorhanden
            this.hideLoading($table);

            // Overlay generieren
            const $overlay = $('<div>', {
                class: bsTableClasses.overlay + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-body',
                css: {
                    zIndex: 4, opacity: 0 // Das Overlay startet unsichtbar
                }
            }).appendTo(wrapper);

            // Placeholder-Struktur erstellen (Inhalt des Overlays)
            $('<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">' + '<span class="visually-hidden">Loading...</span>' + '</div>').appendTo($overlay);

            // Sanftes Einblenden mit animate
            $overlay.animate({opacity: 0.75}, 100); // Dauer: 300ms
        },
        /**
         * Hides the loading overlay for the specified table element.
         * Stops any ongoing animation on the overlay and animates its opacity to 0 before removing it from the DOM.
         *
         * @param {jQuery} $table - The jQuery object representing the table element for which the loading overlay should be hidden.
         * @return {void} This method does not return a value.
         */
        hideLoading($table) {
            const $overlay = $(getOverlay($table));
            if (!$overlay.length) {
                return;
            } // Abbruch, falls kein Overlay vorhanden ist

            // Vorherige Animation stoppen und sanftes Ausblenden starten
            $overlay.stop().animate({opacity: 0}, 100, function () {
                // Nach dem Ausblenden das Overlay vollständig entfernen
                $(this).remove();
            });
        }
    }

    /**
     * A jQuery plugin function which extends jQuery's prototype to provide functionality for initializing
     * and interacting with a Bootstrap-based table. This method can be used for creating or handling
     * a table styled in accordance with Bootstrap design guidelines. Specific behaviors or enhancements
     * for the table can be applied through the options provided.
     *
     * @function
     * @name $.fn.bsTable
     */
    $.fn.bsTable = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            return $(this); // No element selected
        }
        if ($(this).length > 1) {
            // If multiple tables are selected, apply the logic to each table individually
            return $(this).each(function () {
                return $(this).bsTable(optionsOrMethod, ...args);
            });
        }

        const $table = $(this);

        // Initialize Table (Synchronous)
        initTable($table, optionsOrMethod);

        // If a method is specified, we'll run it here
        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'getVersion': {
                    return $.bsTable.version;
                }
                case 'getData' : {
                    return getResponse($table).rows;
                }
                case 'getSelections': {
                    return getSelected($table);
                }
                case 'getOptions': {
                    return getSettings($table);
                }
                case 'getScrollPosition': {
                    return methods.getScrollPosition($table);
                }
                case 'showLoading': {
                    methods.showLoading($table);
                    break;
                }
                case 'hideLoading': {
                    methods.hideLoading($table);
                    break;
                }
                case 'refresh': {
                    const arg = args.length ? args[0] : null;
                    refresh($table, arg);
                    break;
                }
                case 'refreshOptions': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object') {
                        methods.refreshOptions($table, arg);
                    } else {
                        console.warn('Invalid argument for refreshOptions: ', arg);
                    }
                    break;
                }
                case 'setCaption': {
                    const arg = args.length ? args[0] : null;
                    setCaption($table, arg);
                    break;
                }
                case 'hideRow': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object' && arg.hasOwnProperty('index')) {
                        methods.hideRowByIndex($table, arg.index);
                    } else {
                        console.warn('Invalid argument for hideRow: ', arg);
                    }
                    break;
                }
                case 'showRow': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object' && arg.hasOwnProperty('index')) {
                        methods.showRowByIndex($table, arg.index);
                    } else {
                        console.warn('Invalid argument for showRow: ', arg);
                    }
                    break;
                }
                case 'getHiddenColumns': {
                    return methods.getHiddenColumns($table);
                }
                case 'getVisibleColumns': {
                    return methods.getVisibleColumns($table);
                }
                case 'load': {
                    const arg = args.length ? args[0] : null;
                    if (Array.isArray(arg)) {
                        const settings = getSettings($table);
                        settings.data = arg;
                        setSettings($table, settings);
                        refresh($table, {pageNumber: 1});
                    } else {
                        console.warn('Invalid argument for load: ', arg);
                    }
                    break;
                }
                default: {
                    console.warn(`Unknown method: ${optionsOrMethod}`);
                    break;
                }
            }
        }

        return $table;
    };


    /**
     * Initializes a table with the given settings or method, ensuring proper configuration
     * for options, columns, and height. If the table has already been initialized, it updates
     * the options if a valid configuration object is provided.
     *
     * @param {jQuery} $table - The jQuery element representing the table that needs to be initialized.
     * @param {Object|string} optionsOrMethod - Either:
     *                                           1. An options object to configure the table (used during initialization), or
     *                                           2. A string specifying a method to invoke (for already initialized tables).
     * @return {void} The function does not return anything directly. Instead, it configures or modifies
     *                the table element, updates its settings, and manages its initialization state.
     */
    function initTable($table, optionsOrMethod) {
        // **Step 1: Check if the table has already been initialized.**
        if ($($table).data('bsTable')) {
            // If the table is already initialized and a configuration object is passed:
            if (typeof optionsOrMethod === 'object') {
                // Refresh the table's options/settings using the provided configuration.
                methods.refreshOptions($table, optionsOrMethod);
            }
            // Exit early to avoid reinitialization.
            return;
        }

        // **Step 2: Ensure global events are initialized once for all tables.**
        if (!$.bsTable.globalEventsBound) {
            registerGlobalTableEvents(); // Bind global initialization events (executed only once).
        }

        // **Step 3: Resolve configuration options.**
        // If a configuration object is provided, use it; otherwise, use an empty object.
        const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
        // Merge defaults, table-specific data (data-* attributes), and provided options into a single settings object.
        const settings = $.extend(true, {}, $.bsTable.getDefaults(), $($table).data() || {}, options || {});

        // **Step 4: Handle missing table data or column definitions.**
        // If no `data` and no `columns` are already defined in the settings, extract them from the existing HTML table.
        if (!settings.data && !settings.columns.length) {
            // Use the `getRawData` helper to extract existing table data and structure.
            const raw = getRawData($table);
            settings.data = raw.data;           // Extracted data (rows).
            settings.columns = raw.columns;     // Extracted column definitions.
            settings.showHeader = raw.showHeader; // Whether a <thead> exists.
            settings.showFooter = raw.showFooter; // Whether a <tfoot> exists.

            // Log the extracted columns for debugging purposes.
            console.log(settings.columns);
        }

        // **Step 5: Create a `bsTable` object to store the table's state and settings.**
        const bsTable = {
            settings: settings,                 // The full configuration object for the table.
            toggleView: settings.cardView === true, // Determine if the card view mode should be enabled.
            toggleCustomView: settings.customView === true, // Determine if the custom view mode should be enabled.
            expanded: [],                       // Track expanded rows (if applicable).
            response: [],                       // Store AJAX responses (if applicable).
            selected: [],                       // Track selected rows (if applicable).
        };

        // **Step 6: Attach the table's state object to the DOM element.**
        $($table).data('bsTable', bsTable);

        // **Step 7: Validate and process table settings before applying them.**
        makeSettingsValid($table);

        // **Step 8: Build the structural elements of the table.**
        // This step ensures the table is visually constructed with all required DOM elements and styles.
        build.structure($table);

        // **Step 9: Refresh the table's content.**
        // This involves loading or rendering the table data based on the updated settings.
        refresh($table);
    }

    /**
     * Extracts raw data from an HTML table by parsing its structure: `<thead>`, `<tbody>`, and `<tfoot>`.
     * Generates a list of column definitions and rows of data while handling cases with missing headers or inconsistent rows.
     *
     * @param {jQuery} $table - The jQuery object representing the HTML table element.
     * @returns {Object} - An object containing column definitions, table data (each row as an object),
     *                     and metadata about the presence of a header and footer.
     */
    function getRawData($table) {
        // Select direct child `<thead>`, `<tbody>`, and `<tfoot>` elements of the table.
        const $thead = $table.children('thead');
        const $tbody = $table.children('tbody');
        const $tfoot = $table.children('tfoot');

        // Arrays to store column definitions and rows of data from the table.
        const columns = [];
        const data = [];

        // **Step 1: Extract columns from `<thead>` (if it exists).**
        if ($thead.length) {
            // Loop through all `<th>` elements in `<thead>` and extract column definitions.
            $thead.children('tr').children('th').each(function (index) {
                const $th = $(this);
                // Merge default column properties with data attributes from `<th>`.
                const column = $.extend(true, {}, $.bsTable.getColumnDefaults(), $th.data() || {});

                // Ensure each column has a `field` and `title` property as fallbacks.
                column.field = column.field || `column_${index + 1}`;
                column.title = column.title || $th.text().trim() || `Column ${index + 1}`;

                // Add the column definition to the columns array.
                columns.push(column);
            });
        }

        // **Step 2: Handle missing headers by creating columns from `<tbody>` (if no `<thead>` exists).**
        if (!columns.length && $tbody.length) {
            // Use the first `<tr>` in `<tbody>` to create placeholder columns.
            const $firstRow = $tbody.children('tr:first');
            $firstRow.children('td').each(function (index) {
                // Generate default column settings for each `<td>` cell in the first row.
                const column = $.extend(true, {}, $.bsTable.getColumnDefaults(), {});
                column.field = `column_${index + 1}`;
                column.title = `Column ${index + 1}`;
                columns.push(column);
            });
        }

        // At this point, the `columns` array is guaranteed to either:
        // - Contain column definitions (from `<thead>` or generated as fallbacks), OR
        // - Be empty if the table has no `<thead>` or `<tbody>`.

        // **Step 3: Extract rows of data from `<tbody>` (if it exists).**
        if ($tbody.length) {
            const maxColumns = columns.length; // Determine the maximum expected columns from the header.

            // Process each `<tr>` in `<tbody>`.
            $tbody.children('tr').each(function (rowIndex) {
                const $tr = $(this);
                const row = {}; // Create an object to represent the row's data.

                const $tds = $tr.children('td');

                // **Step 3a: Process existing `<td>` cells (ignore extra cells).**
                $tds.each(function (tdIndex) {
                    if (tdIndex < maxColumns) {
                        const $td = $(this);
                        const column = columns[tdIndex] || { field: `extra_column_${tdIndex + 1}` }; // Fallback column.
                        row[column.field] = $td.html().trim(); // Map the `<td>` content to the corresponding column field.
                    }
                });

                // **Step 3b: Fill missing cells if the row has fewer `<td>` than the header specifies.**
                for (let i = $tds.length; i < maxColumns; i++) {
                    const column = columns[i];
                    row[column.field] = null; // Set missing columns to `null`.
                }

                // Add the processed row to the `data` array.
                data.push(row);
            });
        }

        // **Step 4: Return the extracted data.**
        return {
            showHeader: $thead.length > 0 && $thead.children('tr').length > 0, // Indicate if the table has a `<thead>`.
            showFooter: $tfoot.length > 0, // Indicate if the table has a `<tfoot>`.
            columns: columns, // Array of column definitions.
            data: data // Array of row data objects.
        };
    }

    /**
     * Validates and cleans up the settings configuration for the provided table.
     *
     * @param {jQuery} $table - The table object containing the settings configuration to be validated and adjusted.
     * @return {void} No return value. This function modifies the provided table object in place.
     */
    function makeSettingsValid($table) {
        const settings = getSettings($table);
        // Make sure that all columns are fully populated
        const columns = [];
        if (settings.columns && Array.isArray(settings.columns)) {
            settings.columns.forEach(column => {
                if (typeof column === 'object') {
                    columns.push($.extend(true, {}, $.bsTable.getColumnDefaults(), column || {}));
                }
            })
        }

        // refresh the columns
        settings.columns = columns;
        if ($.bsTable.utils.isValueEmpty(settings.columns)) {
            settings.data = [];
        }
        // handle table height
        const height = settings.height || $($table).data('height'); // Ignoriere css('height')

        if (!isNaN(height) && height !== 0) {
            settings.height = height;
        } else {
            settings.height = undefined;
        }

        setSettings($table, settings);

        // Clean the CheckitemConfig
        checkCheckItemsConfig($table);
        // Clean the detailViewConfig
        checkDetailViewConfig($table);
    }

    /**
     * Validates and applies the configuration for the detailView feature of a Bootstrap-based table.
     *
     * This function ensures that the "detailView" option in a table's configuration adheres to required structures and types,
     * falls back to defaults if necessary, and handles invalid configurations by triggering error events.
     *
     * @function checkDetailViewConfig
     * @param {jQuery} $table - A jQuery object representing the table whose detailView settings are being validated.
     *
     * @description
     * - Checks if the "detailView" property is enabled and evaluates its structure.
     * - Merges user-provided settings with system defaults using a deep merge strategy.
     * - Ensures critical properties (e.g., "field", "align") are valid, applying corrections as needed.
     * - Supports error handling and triggers custom error events via the table's onError handler.
     *
     * @example
     * // Example usage
     * const $table = $('#myTable');
     * checkDetailViewConfig($table);
     *
     * // Post-execution: The table's settings now retain a finalized, valid "detailView" configuration.
     */
    function checkDetailViewConfig($table) {
        const settings = getSettings($table);

        // Proceed only if detailView is enabled
        if (settings.detailView === false) {
            return;
        }

        let isValid = true;
        let userConfig;

        // Validate detailView configuration
        if (typeof settings.detailView !== 'object') {
            const error = `Invalid detailView configuration. Please provide an object.`;
            triggerEvent($table, 'error', error);
            isValid = false;
        }

        if (isValid) {
            // Merge user configuration with defaults
            userConfig = $.extend(true, {}, $.bsTable.detailViewDefaults, settings.detailView || {});

            // If Field is not specified, take Idfield from the settings
            if (!userConfig.hasOwnProperty('field') || !userConfig.field) {
                userConfig.field = settings.idField;
            }

            // Ensure the "field" property exists and matches one of the defined columns
            isValid = typeof userConfig.field === 'string' && settings.columns.some(column => column.field === userConfig.field);
            if (!isValid) {
                const error = `DetailView cannot be displayed. Missing or invalid property field: ${userConfig.field}`;
                triggerEvent($table, 'error', error);
            }
        }

        // Apply default values for specific properties
        if (isValid) {
            userConfig.clickRowToToggle = typeof userConfig.clickRowToToggle === 'boolean' ? userConfig.clickRowToToggle : false;
            userConfig.visible = typeof userConfig.visible === 'boolean' ? userConfig.visible : true;
            userConfig.align = ['start', 'left', 'center', 'end', 'right'].includes(userConfig.align) ? userConfig.align : 'center';
            userConfig.valign = ['top', 'middle', 'bottom'].includes(userConfig.valign) ? userConfig.valign : 'middle';
            userConfig.position = ['start', 'end'].includes(userConfig.position) ? userConfig.position : 'start';
        }

        // Finalize settings or disable detailView if invalid
        settings.detailView = isValid ? userConfig : false;
        setSettings($table, settings);
    }

    /**
     * Validates and configures the "check items" (checkboxes/radios) for the given table based on settings.
     * Ensures that the configuration is well-formed, contains all required fields, and meets type/format expectations.
     * If validation fails at any step, it disables the check items in the settings and triggers error handling.
     *
     * @param {jQuery} $table - The table jQuery object whose settings will be verified and (if necessary) adjusted.
     */
    function checkCheckItemsConfig($table) {
        // Retrieve current table settings
        const settings = getSettings($table);

        // Proceed only if "showCheckItems" is enabled; otherwise, clear config and exit
        if (settings.showCheckItems !== true) {
            settings.checkItemsConfig = {};
            setSettings($table, settings);
            return;
        }

        // Define default configuration for check items
        const defaultCheckItemsConfig = $.bsTable.getCheckItemsConfigDefaults();

        // Merge user configuration with defaults, ensuring deep copy
        const userConfig = $.extend(true, {}, defaultCheckItemsConfig, settings.checkItemsConfig || {});
        // If Field is not specified, take Idfield from the settings
        if (!userConfig.hasOwnProperty('field') || !userConfig.field) {
            userConfig.field = settings.idField;
        }
        let isValid = true;
        let isCheckbox = false;

        // Step 1: Validate "type"
        if (isValid) {
            isValid = ['checkbox', 'radio'].includes(userConfig.type);
            if (isValid) {
                isCheckbox = userConfig.type === 'checkbox';
            } else {
                // If invalid, fallback to checkbox by default
                isCheckbox = true;
                userConfig.type = 'checkbox';
            }
        }

        /**
         * Step 2: Validate "name" field existence and adjust format depending on input type
         */
        if (isValid) {
            isValid = typeof userConfig.name === 'string';
            if (isValid) {
                const endsWithBraces = userConfig.name.endsWith('[]');
                if (isCheckbox && !endsWithBraces) {
                    // For checkboxes, ensure name is in array format
                    userConfig.name = userConfig.name + '[]';
                }
                if (!isCheckbox && endsWithBraces) {
                    // For radio, remove "[]" at the end
                    userConfig.name = userConfig.name.slice(0, -2);
                }
            } else {
                // Error when name is missing or invalid
                const error = [
                    `Checkitems cannot be displayed.`,
                    `Missing or invalid type for check item name: ${userConfig.name}.`,
                    'Check item names must be a string.'
                ].join(' ');
                triggerEvent($table, 'error', error);
            }
        }

        // Step 3: Validate presence of referenced field in settings.columns
        if (isValid) {
            isValid = typeof userConfig.field === 'string' && settings.columns.some(column => column.field === userConfig.field);
            if (!isValid) {
                const error = [
                    `Checkitems cannot be displayed.`,
                    `Missing or invalid type for check item field: ${userConfig.field}.`,
                    'The field must be found in one of the settings.collumns.'
                ].join(' ');
                triggerEvent($table, 'error', error);
            }
        }

        // Step 4: Ensure boolean value for "clickRowToSelect"
        if (isValid && typeof userConfig.clickRowToSelect !== 'boolean') {
            userConfig.clickRowToSelect = false;
        }

        // Step 5: Ensure boolean value for "visible"
        if (isValid && typeof userConfig.visible !== 'boolean') {
            userConfig.visible = false;
        }

        // Step 6: Validate allowed values for "align", default to 'center' if invalid
        if (isValid && !['start', 'left', 'center', 'end', 'right'].includes(userConfig.align)) {
            userConfig.align = 'center';
        }

        // Step 7: Validate allowed values for "valign", default to 'middle' if invalid
        if (isValid && !['top', 'middle', 'bottom'].includes(userConfig.valign)) {
            userConfig.valign = 'middle';
        }

        // Step 8: Validate allowed values for "position", default to 'start' if invalid
        if (isValid && !['start', 'end'].includes(userConfig.position)) {
            userConfig.position = 'start';
        }

        // If any step failed, reset configuration and disable check items
        if (!isValid) {
            settings.showCheckItems = false;
        }

        // Apply updated configuration to table settings and persist them
        settings.checkItemsConfig = userConfig;
        setSettings($table, settings);
    }

    /**
     * Sets or updates the caption of a given HTML table element.
     *
     * This method allows updating or removing an existing table caption. A string or an object can be
     * provided to specify the caption text and other attributes such as positioning or custom classes.
     *
     * @param {jQuery} $table The table element for which the caption should be set or updated.
     * @param {string|object|null} stringOrObject Specifies the caption text or an object containing caption settings.
     *        If a string is provided, it is set as the caption text. If an object is provided, it can include the following properties:
     *        - `text` (string): The caption text.
     *        - `onTop` (boolean): If true, adds a class to position the caption on top of the table.
     *        - Additional table-specific class configuration may come from settings.
     *        If null or an empty value is provided, the caption is removed.
     *
     * @return {void} This function does not return a value. It directly modifies the DOM element's caption.
     */
    function setCaption($table, stringOrObject) {
        const settings = getSettings($table);
        let caption = $($table).find('caption:first');
        const isEmpty = $.bsTable.utils.isValueEmpty(stringOrObject);
        if (isEmpty) {
            caption.remove();
            return;
        }
        const captionClasses = [];
        const isString = typeof stringOrObject === 'string';
        const isObject = typeof stringOrObject === 'object';
        const captionText = isString ? stringOrObject : (isObject && stringOrObject && 'text' in stringOrObject) ? stringOrObject.text : null;
        if (!caption.length) {
            caption = $('<caption>', {
                html: captionText,
            }).prependTo($table);
        } else {
            caption.html(captionText);
        }

        if (isObject) {
            if (stringOrObject.hasOwnProperty('onTop') && stringOrObject.onTop === true) {
                captionClasses.push('caption-top');
                caption.addClass('caption-top');
            }
        }

        if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('caption')) {

            caption.attr('class', '');

            settings.classes.caption.split(' ').forEach(className => {
                const classNameCheck = className.trim();
                if (!$.bsTable.utils.isValueEmpty(classNameCheck)) {
                    captionClasses.push(classNameCheck);
                }
            });

            caption.addClass(captionClasses.join(' '));
        }
    }

    /**
     * Refreshes the table data with updated settings, retrieves data from the server, and re-renders the table.
     * The method processes optional parameters for customization and executes related events after data loading.
     *
     * @param {jQuery} $table - The table element to be refreshed.
     * @param {object} [options=null] - Optional parameters for the refresh process. Possible keys include:
     * - `silent` (boolean): If true, suppresses the loading indicator.
     * - `pageNumber` (number): The page number to set for the data retrieval.
     * - `pageSize` (number): The number of records per page. A value of 0 renders all data on one page.
     * - `url` (string): The specific URL to be used for fetching new data.
     * @param {boolean} [triggerRefresh=false] - A flag indicating whether a refresh event should be explicitly triggered.
     * @return {void}
     */
    function refresh($table, options = null, triggerRefresh = false) {
        const settings = getSettings($table);
        let silent = false;
        let pageNumber = settings.pageNumber ?? 1;
        let pageSize = settings.pageSize ?? 10;
        let url = settings.url;
        let update = false;

        // Opt-Parameter verarbeiten
        if (options && typeof options === 'object') {
            if (options.silent) {
                silent = options.silent;
            }
            if (options.pageNumber) {
                pageNumber = Math.max(1, options.pageNumber);
                update = true;
            }
            if (options.pageSize) {
                pageSize = options.pageSize;
                update = true;
            }
            if (options.url) {
                url = options.url;
                update = true;
            }
        }

        // PageSize = 0 -> Alle Daten darstellen
        if (pageSize === 0) {
            pageNumber = 1; // Setze pageSize auf eine einzige Seite mit allen Daten
        }

        // Gesamteinstellungen aktualisieren
        if (update) {
            settings.url = url;
            settings.pageNumber = pageNumber;
            settings.pageSize = pageSize;
            setSettings($table, settings);
        }

        if (!silent) {
            methods.showLoading($table);
        }

        fetchData($table, triggerRefresh)
            .then(() => {
                const response = getResponse($table);
                triggerEvent($table, 'load-success', response);
                build.table($table);
            })
            .catch(error => {
                const errorMsg = "Error when retrieving the data: " + error;
                triggerEvent($table, 'load-error', errorMsg);
            })
            .finally(() => {
                methods.hideLoading($table);
            })
    }

    /**
     * Toggles the view state of a given table by updating its view settings and re-rendering the table.
     *
     * @param {jQuery} $table The table object whose view state needs to be toggled.
     * @return {void} This function does not return a value.
     */
    function toggleView($table) {
        setToggleView($table, !getToggleView($table));
        setToggleCustomView($table, false);
        build.table($table);
    }

    /**
     * Toggles the custom view state for a given table element.
     * If the custom view is currently active, it will deactivate it and vice versa.
     *
     * @param {jQuery} $table The table element for which the custom view state is toggled.
     * @return {void} This function does not return a value.
     */
    function toggleCustomView($table) {
        setToggleCustomView($table, !getToggleCustomView($table));
        setToggleView($table, false);
        build.table($table);
    }

    /**
     * Fetches data for the specified table element and processes it based on the provided settings.
     * It supports local data, remote API calls, pagination, sorting, and search functionality.
     *
     * @param {jQuery} $jqTable - The jQuery object representing the table element for which data is being fetched.
     * @param {boolean} [triggerRefresh=false] - Indicates whether a refresh event should be triggered after the data is fetched.
     * @return {Promise<void>} A Promise that resolves when the data fetching and processing is completed or rejects with an error if fetching fails.
     */
    function fetchData($jqTable, triggerRefresh = false) {
        const $table = $($jqTable);
        const settings = getSettings($table);
        if (settings.debug) {
            console.groupCollapsed("fetchData");
            console.log("Starte fetchData für Tabelle:", $table); // DEBUG
        }
        return new Promise((resolve, reject) => {
            if (settings.debug) {
                console.log("Einstellungen geladen:", settings); // DEBUG
            }
            if (!settings.url && !(settings.data && Array.isArray(settings.data))) {
                if (settings.debug) {
                    console.error("Fehler: Weder eine API-URL noch lokale Daten konfiguriert."); // DEBUG
                }
                reject(new Error("Neither a URL nor local data were provided."));
                return;
            }

            let params = {};

            if (settings.sortName && settings.sortOrder) {
                params.sort = settings.sortName;
                params.order = settings.sortOrder;
            }

            // handle limit and offset
            // check and adapt pagination
            const pageNumber = settings.pageNumber > 0 ? settings.pageNumber : 1;
            const pageSize = settings.pageSize ?? 10; // Set a standard value if pageSize is not defined

            if (pageSize === 0) {
                if (settings.debug) {
                    console.log("Besonderer Fall: pageSize = 0 (Alle Datensätze anzeigen).");
                }
                params.limit = null; // no limitation
                params.offset = 0;   // no shift
            } else {
                const offset = (pageNumber - 1) * pageSize;
                params.limit = pageSize;
                params.offset = offset;
                if (settings.debug) {
                    console.log("Pagination-Parameter berechnet:", params); // DEBUG
                }
            }

            // Handle search
            // Suchkriterien verarbeiten
            const searchInput = $(getSearchInput($table));
            if (settings.search && searchInput.length) {
                const searchValue = searchInput.val()?.trim() || null;
                params.search = searchValue && !$.bsTable.utils.isValueEmpty(searchValue) ? searchValue : null;
                if (settings.debug) {
                    console.log("Suchkriterien verarbeitet:", params.search); // DEBUG
                }
            }

            // handle custom params
            // additional query parameters from the user
            if (typeof settings.queryParams === "function") {
                params = settings.queryParams(params);
                if (settings.debug) {
                    console.log("Zusätzliche Query-Parameter:", params); // DEBUG
                }
            }

            if (triggerRefresh) {
                triggerEvent($table, 'refresh', params);
            }

            // Processing of local data
            if (Array.isArray(settings.data)) {

                if (settings.debug) {
                    console.log("Lokale Daten erkannt. Verarbeite lokale Daten...");
                }

                let filteredData = [...settings.data];

                if (params.sort && params.order) {
                    if (settings.debug) {
                        console.log(`Sortiere lokale Daten nach "${params.sort}" in Reihenfolge "${params.order}".`); // DEBUG
                    }

                    $.bsTable.utils.sortArrayByField(filteredData, params.sort, params.order);

                    if (settings.debug) {
                        console.log("Daten nach Sortierung:", filteredData); // DEBUG
                    }
                }

                // use search if relevant
                if (params.search) {
                    if (settings.debug) {
                        console.log("Suchfilter wird angewendet: ", params.search); // DEBUG
                    }
                    filteredData = filteredData.filter(row => Object.values(row).some(value => value && value.toString().toLowerCase().includes(params.search.toLowerCase())));
                    if (settings.debug) {
                        console.log(`Gefilterte Datenanzahl nach Suchkriterien (${params.search}):`, filteredData.length); // DEBUG
                    }
                }


                const totalRows = filteredData.length;

                if (pageSize === 0 || settings.pagination === false) {
                    // Alle Daten zurückgeben (kein Slice bei pageSize = 0)
                    if (settings.debug) {
                        console.log("Alle Daten für pageSize = 0 oder pagination = false zurückgeben:", totalRows, "Datensätze."); // DEBUG
                    }
                    const responseBefore = {rows: filteredData, total: totalRows};
                    const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                    setResponse($table, responseAfter ?? responseBefore);
                    if (settings.debug) {
                        console.groupEnd();
                    }
                    resolve();
                    return;
                }

                // Pagination-Parameter Berechnung
                const offset = params.offset || 0;
                const start = Math.min(totalRows, offset); // Start-Position
                const end = Math.min(totalRows, start + pageSize); // End-Position
                const rowsToRender = end - start;
                if (settings.debug) {
                    console.log(`Pagination-Details: Offset=${offset}, Start=${start}, End=${end}, Rows to Render=${rowsToRender}`); // DEBUG
                }

                if (rowsToRender <= 0) {
                    if (settings.debug) {
                        console.warn("Pagination-Ergebnis ist leer. Es gibt keine Daten für diese Seite."); // DEBUG
                    }
                    const responseBefore = {rows: [], total: totalRows};
                    const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                    setResponse($table, responseAfter ?? responseBefore);
                    if (settings.debug) {
                        console.groupEnd();
                    }
                    resolve();
                    return;
                }

                // Daten für die aktuelle Seite schneiden
                const slicedData = filteredData.slice(start, end);
                if (settings.debug) {
                    console.log("Daten für aktuelle Seite (Slice-Ergebnis):", slicedData); // DEBUG
                }

                const responseBefore = {rows: slicedData, total: totalRows};
                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, responseBefore);

                setResponse($table, responseAfter ?? responseBefore);
                if (settings.debug) {
                    console.groupEnd();
                }
                resolve();
                return;
            }

            if (settings.url) {
                if (settings.debug) {
                    console.log("Starte Datenabruf:", settings.url, "mit Parametern:", params); // DEBUG
                }

                if (typeof settings.url === "function") {
                    // `url` ist eine Funktion
                    settings.url(params)
                        .then(response => {
                            const processedResponse = Array.isArray(response) ? {
                                rows: response,
                                total: response.length
                            } : {...response, rows: response.rows || [], total: response.total || 0};

                            if (settings.debug) {
                                console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                            }

                            const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                            $table.data("response", responseAfter ?? processedResponse);
                            resolve();
                        })
                        .catch(error => {
                            if (settings.debug) {
                                console.error("Fehler bei der Verarbeitung der Funktion:", error); // DEBUG
                            }
                            reject(new Error(`Fehler bei der API-Abfrage (Funktion): ${error.message || error}`));
                        });
                } else if (typeof settings.url === "string") {
                    const urlFunction = window[settings.url]; // Prüfen, ob der String ein Funktionsname ist
                    if (typeof urlFunction === "function") {
                        // `url`-String repräsentiert eine Funktion
                        urlFunction(params)
                            .then(response => {
                                const processedResponse = Array.isArray(response) ? {
                                    rows: response,
                                    total: response.length
                                } : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                                $($table).data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .catch(error => {
                                if (settings.debug) {
                                    console.error("Error in functional URL processing:", error); // DEBUG
                                }
                                reject(new Error(`Error processing of the function: ${error.message || error}`));
                            });
                    } else {
                        // 'url' is an actual URL and not a function name
                        let defaultAjaxOptions = {
                            url: settings.url, method: "GET", data: params, dataType: "json"
                        };
                        const customAjaxOptions = $.bsTable.utils.executeFunction(settings.ajaxOptions, settings.url, params);
                        if (customAjaxOptions && typeof customAjaxOptions === 'object') {
                            defaultAjaxOptions = $.extend(true, {}, defaultAjaxOptions, customAjaxOptions || {});
                        }
                        const xhr = $($table).data('xhr') || null;
                        if (xhr !== null) {
                            xhr.abort();
                            $($table).removeData('xhr');
                        }
                        $table.data('xhr', $.ajax(defaultAjaxOptions)
                            .done(response => {
                                const processedResponse = Array.isArray(response) ? {
                                    rows: response,
                                    total: response.length
                                } : {...response, rows: response.rows || [], total: response.total || 0};

                                if (settings.debug) {
                                    console.log("API-Antwort von String-URL erhalten:", processedResponse); // DEBUG
                                }

                                const responseAfter = $.bsTable.utils.executeFunction(settings.responseHandler, processedResponse);
                                $table.data("response", responseAfter ?? processedResponse);
                                resolve();
                            })
                            .fail((xhr, status, error) => {
                                if (settings.debug) {
                                    console.error("Fehler bei der API-Abfrage (String-URL):", status, error); // DEBUG
                                }
                                reject(new Error(`Fehler bei der API-Abfrage (String-URL): ${status}, ${error}`));
                            })
                            .finally(() => {
                                $table.removeData('xhr');
                            }));
                    }
                }
            }
        });
    }

    /**
     * The `build` object contains methods responsible for managing the structure, layout, interactive components,
     * and visibility of elements for a dynamic, table-based user interface. These methods enable responsive
     * design and provide features such as pagination, visibility toggles, and column controls.
     *
     * This object expects jQuery to be used for DOM manipulation and interactions.
     */
    const build = {
        /**
         * Configures the structure and layout for the provided table element, applying a wrapper and responsive design.
         *
         * @param {jQuery} $tableElement The jQuery object representing the target table element.
         * @return {void} This method does not return any value.
         */
        structure($tableElement) {
            const $table = $($tableElement);
            $table.empty();
            const settings = getSettings($table);

            const wrapperId = $.bsTable.utils.getUniqueId();
            const $wrapper = $('<div>', {
                class: bsTableClasses.wrapper + ' position-relative',
                id: wrapperId,
            }).insertAfter($table);

            const isChild = $(getClosestWrapper($wrapper)).length > 0 ? 'true' : 'false';
            $wrapper.attr('data-child', isChild);

            const $wrapperResponsive = $('<div>', {
                class: 'table-responsive ' + bsTableClasses.wrapperResponsive,
            }).appendTo($wrapper);


            $table.attr('data-wrapper', wrapperId);

            $table.appendTo($wrapperResponsive);

            setCaption($table, settings.caption);

            this.tableTopContainer($table);
            this.tableBottomContainer($table);

            $('<thead></thead>').appendTo($table);
            $('<tbody></tbody>').appendTo($table);
            $('<tfoot></tfoot>').appendTo($table);
        },
        /**
         * Creates a dropdown menu for selecting the number of rows to display in a table's pagination.
         *
         * @param {jQuery} $tableElement - The jQuery-wrapped table element for which the dropdown should be created.
         * @return {jQuery} - A jQuery-wrapped HTML element containing the dropdown for page size selection.
         */
        dropdownPageList($tableElement) {
            const $table = $($tableElement);
            const settings = getSettings($table);
            const response = getResponse($table);
            const totalRows = response.total || (response.rows ? response.rows.length : 0);
            // Berechnung der Anzeige-Daten (Start- und Endzeilen)
            const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
            // const currentPage = settings.pageNumber || 1;
            const smallBtn = $table.hasClass('table-sm') ? 'btn-sm' : '';

            // Haupt-Wrapper (d-flex für Flexbox)
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group', 'data-role': 'tablePaginationPageSize'
            });
            // Dropdown für die Zeilenanzahl pro Seite
            const $dropdownToggle = $('<button>', {
                'class': `btn ${smallBtn} btn-secondary dropdown-toggle`,
                'type': 'button',
                'id': 'dropdownPaginationPageSize',
                'data-bs-toggle': 'dropdown',
                'aria-expanded': 'false'
            }).html((pageSize === totalRows ? 'All' : pageSize));

            const $dropdownMenu = $('<ul>', {
                'css': {
                    zIndex: 1021 // over sticky header
                },
                'class': 'dropdown-menu dropdown-menu-end  bg-gradient ',
                'aria-labelledby': 'dropdownPaginationPageSize'
            });

            // Dropdown-Optionen hinzufügen
            settings.pageList
                .filter(page => page === 'All' || page < totalRows)
                .forEach(page => {
                    const value = page === 'All' ? 0 : page;
                    const isAll = value === 0;
                    const isActive = (isAll && pageSize === 0) || page === pageSize;
                    const text = isAll ? 'All' : page;
                    const $dropdownItem = $('<li>').append($('<a>', {
                        class: `dropdown-item ${isActive ? 'active' : ''}`, href: '#', 'data-page': value
                    }).text(text));
                    $dropdownMenu.append($dropdownItem);
                });

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        },
        /**
         * Generates a dropdown menu for controlling column visibility in a table.
         * The dropdown contains checkboxes for each column, allowing users to toggle columns' visibility.
         *
         * @param {jQuery} $table The table element for which the dropdown will control column visibility.
         * @param {string} smallBtnClass Additional CSS class to apply to the dropdown toggle button for appearance purposes.
         * @return {jQuery|null} A jQuery representation of the dropdown menu wrapper if columns are available, or null if no columns exist.
         */
        dropdownColumns($table, smallBtnClass) {
            const settings = getSettings($table);

            if (!settings.columns || !settings.columns.length) {
                return null; // Keine Spalten vorhanden
            }

            // const disabledClass = getToggleCustomView($table) ? 'disabled' : '';

            // Haupt-Wrapper des Dropdowns
            const $dropdownWrapper = $('<div>', {
                'class': 'dropdown btn-group', 'data-role': 'tableColumnVisibility'
            });

            // Dropdown-Toggle-Button
            const $dropdownToggle = $('<button>', {
                'class': `btn btn-secondary dropdown-toggle ${smallBtnClass} $(disabledClass)`,
                'type': 'button',
                'id': 'dropdownColumnVisibility',
                'data-bs-toggle': 'dropdown',
                'data-bs-auto-close': "outside",
                'aria-expanded': 'false'
            }).html('<i class="bi bi-layout-three-columns"></i>');

            // Dropdown-Menü
            const $dropdownMenu = $('<div>', {
                'css': {
                    zIndex: 1021 // over sticky header
                }, 'class': 'dropdown-menu bg-gradient dropdown-menu-end', 'aria-labelledby': 'dropdownColumnVisibility'
            });

            let colIndex = 0;

            // Zähler für sichtbare Spalten
            let checkedColumnsCount = settings.columns.filter(column => column.visible !== false).length;

            /**
             * Updates the states of checkboxes based on the configuration and current selection.
             * Enables or disables checkboxes to ensure that a minimum number of checkboxes remain selected.
             * Any unchecked checkboxes are always enabled.
             *
             * @return {void} Does not return a value.
             */
            function updateCheckboxStates() {
                const checked = $dropdownMenu.find('input[type="checkbox"]:checked'); // Alle aktivierten Checkboxen
                const notChecked = $dropdownMenu.find('input[type="checkbox"]:not(:checked)'); // Alle deaktivierten Checkboxen

                // If the number of checked checkboxes is <= minimum countColumns, deactivate the checked checkboxes
                if (checked.length <= settings.minimumCountColumns) {
                    checked.prop('disabled', true); // Deactivate checked checkboxes
                } else {
                    checked.prop('disabled', false);// Activate checked checkboxes when a limit is not reached
                }

                // non-checked checkboxes always remain active (disable = false)
                notChecked.prop('disabled', false);
            }

            // Add a checkbox for each column
            settings.columns.forEach((column) => {
                const isVisible = column.visible !== false;
                const uniqueId = $.bsTable.utils.getUniqueId('bs_table_column_visibility_');
                // Erstelle ein Menü-Item mit Checkbox
                const $menuItem = $('<div>', {'class': 'dropdown-item px-3'}).append($('<div>', {'class': 'form-check d-flex align-items-center'}).append($('<input>', {
                    'class': 'form-check-input me-2', // Abstand zur Checkbox hinzufügen
                    'type': 'checkbox', 'id': `${uniqueId}`, 'data-column-index': colIndex, 'checked': isVisible
                }).on('change' + namespace, function (e) {
                    const $checkbox = $(e.currentTarget);
                    const columnIndex = $checkbox.data('column-index');
                    const isChecked = $checkbox.is(':checked');

                    // Sichtbarkeitsstatus ändern
                    settings.columns[columnIndex].visible = isChecked;
                    setSettings($table, settings);
                    toggleColumnVisibility($table, columnIndex, isChecked);

                    // Sichtbare Spalten anpassen
                    checkedColumnsCount += isChecked ? 1 : -1;

                    // Checkbox-Zustände aktualisieren
                    updateCheckboxStates();
                }), $('<label>', {
                    'class': 'form-check-label mb-0', 'for': `${uniqueId}`
                })
                    .text(column.title || column.field || `Column ${colIndex + 1}`)
                    .on('click' + namespace, function (e) {
                        e.preventDefault(); // Verhindert das Schließen des Dropdowns
                        const label = $(e.currentTarget);
                        const $checkbox = $(`#${label.attr('for')}`); // Checkbox anhand der ID finden
                        $checkbox.prop('checked', !$checkbox.is(':checked')).trigger('change' + namespace); // Checkbox toggeln und Change-Event auslösen
                    })));

                $dropdownMenu.append($menuItem);
                colIndex++;
            });

            // Initiale Deaktivierungsprüfung
            updateCheckboxStates();

            $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
            return $dropdownWrapper;
        },
        /**
         * Generates and appends action buttons to the table's button container based on the current settings.
         *
         * @param {jQuery} $tableElement - A jQuery object representing the table element.
         * @return {void} This function does not return a value.
         */
        buttons($tableElement) {
            const $table = $($tableElement);
            const $wrapper = $(getWrapper($table));
            const settings = getSettings($table);
            const $btnContainer = $wrapper.find(`.${bsTableClasses.buttons}:first`).empty();
            const smallBtnClass = $table.hasClass('table-sm') ? 'btn-sm' : '';

            if (settings.showButtonRefresh === true) {
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnRefresh} ${smallBtnClass}`,
                    html: `<i class="${settings.icons.refresh}"></i>`,
                }).appendTo($btnContainer);
            }

            if (settings.showButtonToggleColumns === true) {
                const toggleIcon = getToggleView($table) ? settings.icons.toggleOn : settings.icons.toggleOff;
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnToggle} ${smallBtnClass}`,
                    html: `<i class="${toggleIcon}"></i>`,
                }).prependTo($btnContainer);
            }
            if (settings.showButtonCustomView === true) {
                const toggleIcon = getToggleCustomView($table) ? settings.icons.customViewOn : settings.icons.customViewOff;
                $(`<button>`, {
                    class: `btn btn-secondary ${bsTableClasses.btnCustomView} ${smallBtnClass}`,
                    html: `<i class="${toggleIcon}"></i>`,
                }).prependTo($btnContainer);
            }

            if (settings.showButtonColumnsChooser === true) {
                const dropDown = this.dropdownColumns($table, smallBtnClass);
                if (dropDown) {
                    $(dropDown).prependTo($btnContainer);
                }
            }
        },
        /**
         * Creates and configures the top container of a table, including elements such as toolbar, search functionality, pagination, and other UI components.
         *
         * @param {jQuery} $table - A jQuery object representing the target table element for which the top container is created.
         * @return {void} This method does not return a value, but modifies the DOM structure to include the generated top container and its components.
         */
        tableTopContainer($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);

            let flexClass = 'flex-row';
            if (!['right', 'end'].includes(settings.paginationHAlign)) {
                flexClass += ' flex-row-reverse';
            }

            let gapClass = '';
            if ((settings.pagination === true && ['top', 'both'].includes(settings.paginationVAlign)) || settings.search === true || settings.toolbar || settings.showButtonRefresh) {
                gapClass = 'gap-2 py-2';
            }

            const template = '' + '<div class="d-flex flex-column ' + gapClass + ' ' + bsTableClasses.topContainer + '">' + '<div class="d-flex justify-content-end align-items-end">' + '<div class="d-flex ' + bsTableClasses.toolbar + ' me-auto"></div>' + '<div class="d-flex ' + bsTableClasses.search + '"></div>' + '<div class="btn-group ' + bsTableClasses.buttons + '"></div>' + '</div>' + '<div class="d-flex justify-content-between align-items-end ' + flexClass + '">' + '<div class="' + bsTableClasses.paginationDetails + '"></div>' + '<div class="' + bsTableClasses.pagination + ' top"></div>' + '</div>' + '</div>';

            // top container consisting of 1-n lines
            const $tableTopContainer = $(template).prependTo($wrapper);
            const $toolbarContainer = $tableTopContainer.find('.' + bsTableClasses.toolbar);
            const $searchWrapper = $tableTopContainer.find('.' + bsTableClasses.search);


            // If a toolbar element is defined, add it to the first line and
            // Put Margin End on the car so that it is centered on the left
            if (settings.toolbar && $(settings.toolbar).length > 0) {
                $(settings.toolbar).prependTo($toolbarContainer);
            }

            // Create a search wrapper (left)
            // If the search is activated, add an input field and logic
            if (settings.search === true) {
                const placeholder = $.bsTable.utils.executeFunction(settings.formatSearch)
                const $searchInputGroup = $(`<div class="input-group">` + '<span class="input-group-text">' + '<i class="' + settings.icons.search + '"></i>' + '</span>' + '<input type="search" class="form-control ' + bsTableClasses.searchInput + '" placeholder="' + placeholder + '">' + '</div>');
                $searchInputGroup.appendTo($searchWrapper);
            }


            this.buttons($table);
        },
        /**
         * Generates and appends a table bottom container with pagination and additional UI elements to the specified table.
         *
         * @param {jQuery} $table - A jQuery object representing the table for which the bottom container is being created.
         * @return {void} This method does not return a value.
         */
        tableBottomContainer($table) {
            const $wrapper = getWrapper($table);
            const settings = getSettings($table);

            let flexClass = 'flex-row';
            if (!['right', 'end'].includes(settings.paginationHAlign)) {
                flexClass += ' flex-row-reverse';
            }

            let gapClass = '';
            if ((settings.pagination === true && ['bottom', 'both'].includes(settings.paginationVAlign))) {
                gapClass = 'gap-2 py-2';
            }

            const template = [
                '<div class="d-flex flex-column ' + gapClass + ' ' + bsTableClasses.bottomContainer + '">',
                '<div class="d-flex justify-content-between align-items-start ' + flexClass + '">',
                '<div class="' + bsTableClasses.paginationDetails + '"></div>',
                '<div class="' + bsTableClasses.pagination + ' bottom"></div>',
                '</div>',
                '<div class="' + bsTableClasses.wrapperSelection + '"></div>',
                '</div>'
            ].join('');
            $(template).appendTo($wrapper);
        },
        /**
         * Generates and appends hidden input elements for selected rows to the specified table's bottom container.
         * The hidden inputs are created based on table settings and selections, and are used to manage selected data.
         *
         * @param {jQuery} $table The table element for which the hidden inputs are created. This can be a jQuery-wrapped object or a native HTML element.
         * @return {void} Does not return a value.
         */
        hiddenSelectedInputs($table) {
            const selections = getSelected($table);
            const settings = getSettings($table);

            const $bottomContainer = $(getTableBottomContainer($table))
                .find(`.${bsTableClasses.wrapperSelection}`)
                .empty();

            if (settings.showCheckItems === true) {
                const checkItem = settings.checkItemsConfig;
                selections.forEach(row => {
                    const value = row[checkItem.field];
                    $('<input>', {
                        type: 'hidden',
                        name: `${checkItem.name}`,
                        value: value,
                    }).appendTo($bottomContainer);
                });
                this.updateCheckItemsActive($table);
            }
        },
        /**
         * Updates the active state and icons for check items in a given table
         * based on the current selection states of its rows. Also updates the state
         * and icon of the "select all" (header) checkbox/radio in the table header.
         *
         * @param {jQuery} $tableElement - The jQuery object representing the table element whose check items need to be updated.
         * @return {void} No return value. Updates the table's DOM directly.
         */
        updateCheckItemsActive($tableElement) {
            const $table = $($tableElement);
            const settings = getSettings($table);

            // Stop if check items are not enabled in the settings.
            if (settings.showCheckItems !== true) {
                return;
            }

            const checkItemsConfig = settings.checkItemsConfig;

            // Select the relevant tbody and thead elements from the current table.
            const $tbody = $($table.children('tbody'));
            const $thead = $($table.children('thead'));
            const $tfoot = $($table.children('tfoot'));

            // Gather the current selection and the rows to be displayed.
            const selectedRows = getSelected($table);
            const responseRows = getResponse($table).rows;

            // Get the CSS class used to mark rows as "active" (i.e., selected).
            let activeClassName = null;
            if (typeof settings.classes === "object" && settings.classes.hasOwnProperty('active')) {
                activeClassName = settings.classes.active;
            }

            // Iterate through each data row and update its DOM representation:
            let index = 0;
            responseRows.forEach(row => {
                // Determine if this row is selected, by comparing its field to the selected rows.
                const selected = selectedRows.some(
                    selected => selected[checkItemsConfig.field] === row[checkItemsConfig.field]
                );

                // Find the corresponding <tr> for this row index in tbody.
                const $tr = $($tbody.children('tr[data-index]')).eq(index);

                // Find the check item cell in the row (first matching).
                const $td = $tr.find('td[data-check-item]').first();

                // Update the data attribute to reflect the checked state.
                $td.attr('data-check-item', selected ? 'true' : 'false');

                // Choose the correct icon class depending on state.
                const iconClass = selected ? settings.icons.check : settings.icons.uncheck;

                // Find the icon element within the cell and update its classes.
                const $icon = $td.find('.' + bsTableClasses.checkIcon);

                // Remove all "check" and "uncheck" classes to ensure only the correct one is present.
                [settings.icons.check, settings.icons.uncheck].forEach(iconSet =>
                    iconSet.split(/\s+/).forEach(cls =>
                        $icon.removeClass(cls)
                    )
                );
                // Add the correct icon class for the current (checked/unchecked) state.
                $icon.addClass(iconClass);

                // Optionally, add or remove an "active" class to the <tr> to highlight selected rows.
                if (activeClassName) {
                    if (selected) {
                        $tr.addClass(activeClassName);
                    } else {
                        $tr.removeClass(activeClassName);
                    }
                }
                index++;
            });

            // --- Update the header (select-all) icon and attributes ---

            // Prepare a list of all selected field values.
            const selectedValues = selectedRows.map(row => row[checkItemsConfig.field]);
            let markHeaderChecked = false;

            // Checkbox: select-all is checked only if ALL visible rows are selected.
            // Radio: select-all is checked if AT LEAST ONE visible row is selected.
            if (checkItemsConfig.type === 'checkbox') {
                markHeaderChecked = responseRows.every(
                    row => selectedValues.indexOf(row[checkItemsConfig.field]) !== -1
                );
            } else if (checkItemsConfig.type === 'radio') {
                markHeaderChecked = responseRows.some(
                    row => selectedValues.indexOf(row[checkItemsConfig.field]) !== -1
                );
            }

            // Find the header <th> responsible for select-all functionality and update its attribute.
            const $headerTh = $thead.find('th[data-check-item-all]').first();
            const $footerTh = $tfoot.find('th[data-check-item-all]').first();
            $headerTh.attr('data-check-item-all', markHeaderChecked ? 'true' : 'false');
            $footerTh.attr('data-check-item-all', markHeaderChecked ? 'true' : 'false');

            // Update the select-all icon in the header cell.
            const $headerIcon = $headerTh.find('.' + bsTableClasses.checkIcon);
            const $footerIcon = $footerTh.find('.' + bsTableClasses.checkIcon);

            // Remove all potential check/uncheck-all classes.
            [settings.icons.checkAll, settings.icons.uncheckAll].forEach(iconSet =>
                iconSet.split(/\s+/).forEach(cls => {
                        $headerIcon.removeClass(cls)
                        $footerIcon.removeClass(cls)
                    }
                )
            );
            // Add the correct class for the header icon depending on the aggregate checked state.
            $headerIcon.addClass(markHeaderChecked ? settings.icons.checkAll : settings.icons.uncheckAll);
            $footerIcon.addClass(markHeaderChecked ? settings.icons.checkAll : settings.icons.uncheckAll);
        },
        /**
         * Generates a pagination navigation element for a given table based on total rows and settings.
         *
         * @param {jQuery} $tableElement - A jQuery object representing the table for which pagination is being created.
         * @param {number} totalRows - The total number of rows in the table that requires pagination.
         * @return {jQuery} Returns a jQuery object representing the generated pagination navigation element.
         */
        pagination($tableElement, totalRows) {
            const $table = $($tableElement);
            // Retrieve table-specific settings for pagination (e.g. page number, page size).
            const settings = getSettings($table);

            // Compute the total number of pages based on the total number of rows and page size.
            const totalPages = Math.ceil(totalRows / settings.pageSize);

            // Determine the current page number (default to 1 if not defined).
            const currentPage = settings.pageNumber || 1;

            // Create a wrapper for the pagination navigation element (using a 'nav' element).
            const $paginationWrapper = $('<nav>', {'data-role': 'tablePagination'});

            const small = $table.hasClass('table-sm');
            // Create an unordered list for pagination links and append it to the wrapper.
            const $paginationList = $('<ul>', {
                class: 'pagination justify-content-center m-0' // Apply Bootstrap styles for centering and margin.
            }).appendTo($paginationWrapper);
            if (small) {
                $paginationList.addClass('pagination-sm');
            }


            /**
             * Helper function to create a pagination item (e.g. page links, "previous", "next").
             * @param {string|null} role - The role of the element (e.g., 'previous', 'next', or null for page numbers).
             * @param {boolean} disabled - Determines whether the item is disabled.
             * @param {boolean} active - Determines whether the item is the active page.
             * @param {string|number} content - The content to display in the pagination link (e.g., a number or HTML).
             */
            const createPageItem = (role, disabled, active, content) => {
                // Create a list item with appropriate Bootstrap classes and append it to the pagination list.
                const $item = $('<li>', {
                    'data-role': role, // Optional role (e.g., 'previous', 'next').
                    class: `page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}` // Apply classes for active/disabled.
                }).appendTo($paginationList);

                // Create the anchor element (link) inside the list item with necessary attributes/events.
                $('<a>', {
                    class: 'page-link', // Apply Bootstrap class to style the link.
                    href: '#', // Prevent actual navigation for the link.
                    tabindex: disabled ? '-1' : '', // Disable focus on the link if it's marked as disabled.
                    'aria-disabled': disabled ? 'true' : 'false', // Set the ARIA attribute for accessibility.
                    html: content // Set the content of the link (HTML or plain text).
                }).appendTo($item);
            };

            // Create the "Previous" button for pagination.
            createPageItem('previous', // Role for the "previous" button.
                currentPage === 1, // Disable if the current page is the first page.
                false, // The "previous" button is never active.
                `<i class="${settings.icons.paginationPrev}"></i>` // Use an icon for the button content.
            );

            // Calculate which page numbers to display as visible links.
            const visiblePages = $.bsTable.utils.calculateVisiblePagesOnNavigation(totalPages, currentPage);

            // Iterate through the calculated visible pages and create page items for each.
            visiblePages.forEach(page => {
                if (page === "...") {
                    // If the page is a placeholder (e.g., "..."), create a disabled page item.
                    createPageItem(null, true, false, '...');
                } else {
                    // Otherwise, create a page item with the specific page number.
                    createPageItem(null, // No specific role for individual page links.
                        false, // Page links are never disabled unless specified.
                        page === currentPage, // Mark as active if this is the current page.
                        page // Display the page number as the content.
                    );
                }
            });

            // Create the "Next" button for pagination.
            createPageItem('next', // Role for the "next" button.
                currentPage === totalPages, // Disable if the current page is the last page.
                false, // The "next" button is never active.
                `<i class="${settings.icons.paginationNext}"></i>` // Use an icon for the button content.
            );

            // Return the completed pagination wrapper to be inserted into the DOM.
            return $paginationWrapper;
        },
        /**
         * Generates and updates the pagination details for a given table. Calculates the rows being displayed
         * based on the current pagination settings and updates the UI accordingly to show relevant details such
         * as current page, total rows, and available page size options.
         *
         * @param {jQuery} $table The jQuery object representing the table for which pagination details should be updated.
         * @param {number} totalRows The total number of rows available in the table data.
         * @return {void} This method does not return a value. It modifies the DOM to reflect updated pagination details.
         */
        paginationDetails($table, totalRows) {
            const settings = getSettings($table);
            const wrapper = $(getClosestWrapper($table));

            // Paginierung prüfen und Berechnungen entsprechend anpassen
            const pageSize = settings.pagination === false ? totalRows : (settings.pageSize || totalRows);
            const currentPage = settings.pagination === false ? 1 : (settings.pageNumber || 1);

            // Berechnung der Anzeige-Daten (Start- und Endzeilen)
            const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
            const endRow = Math.min(totalRows, currentPage * pageSize);

            // Textanzeige: "Showing x to y of total rows"
            const text = $.bsTable.utils.executeFunction(settings.formatShowingRows, startRow, endRow, totalRows);
            const dropdown = $(build.dropdownPageList($table));
            const $paginationText = $('<div>', {
                class: 'd-flex align-items-center', html: `<div class="me-3">${text}</div>`,
            })
            dropdown.appendTo($paginationText);
            const records = $.bsTable.utils.executeFunction(settings.formatRecordsPerPage, pageSize);
            $('<div>', {class: 'ms-2', html: records}).appendTo($paginationText);

            const $allDestinations = wrapper.find('.' + bsTableClasses.paginationDetails);

            if ($allDestinations.length > 0) {
                const showOnTop = ['top', 'both'].includes(settings.paginationVAlign);
                const showOnBottom = ['bottom', 'both'].includes(settings.paginationVAlign);
                const $first = $allDestinations.first().empty();
                const $last = $allDestinations.last().empty();

                if (showOnTop) {
                    $paginationText.clone().appendTo($first);
                }
                if (showOnBottom) {
                    $paginationText.clone().appendTo($last);
                }
            }
        },
        /**
         * Renders a table with the specified settings, including updating its structure, styling, pagination,
         * and other elements such as buttons and search functionality. This function also processes responses
         * and ensures appropriate classes and styles are applied to the table for consistency.
         *
         * @param {jQuery} $tableElement The table object to be rendered. It should include settings, data,
         *                        and configuration properties required for rendering.
         * @return {void} Doesn't return a value. This method directly modifies the table and its associated DOM elements.
         */
        table($tableElement) {
            const $table = $($tableElement);
            const settings = getSettings($table);
            if (settings.debug) {
                console.groupCollapsed("Render Table");
            }
            if (settings.height) {
                // alert(settings.height)
                $(getResponsiveWrapper($table)).css('max-height', settings.height);
            }
            const wrapper = $(getClosestWrapper($table));
            const response = getResponse($table);
            if (settings.debug) {
                console.log("Response:", response);
            }
            const totalRows = response.total || (response.rows ? response.rows.length : 0);
            const pageSize = settings.pageSize;
            const pageNumber = settings.pageNumber;
            let currentPageData = response.rows;
            if (settings.debug) {
                console.log("Total Rows:", totalRows);
                console.log("Page Size:", pageSize);
                console.log("Page Number:", pageNumber);
                console.log("Rows to Render:", currentPageData.length, currentPageData);
                console.groupEnd();
            }

            // if (settings.columns && Array.isArray(settings.columns) && settings.columns.length > 0) {
            this.thead($table, currentPageData);
            this.tbody($table, currentPageData);
            this.tfoot($table, currentPageData);
            this.hiddenSelectedInputs($table);
            // }

            const tableClasses = [];
            if (typeof settings.classes === 'string') {
                settings.classes.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        tableClasses.push(className);
                    }
                });
            } else if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('table')) {
                settings.classes.table.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        tableClasses.push(className);
                    }
                });
            }
            if (!tableClasses.includes('table')) {
                tableClasses.push('table');
            }
            // Set the lower margin to 0 because our bottom container follows
            if (!tableClasses.includes('mb-0')) {
                tableClasses.push('mb-0');
            }
            $table.removeClass();
            $table.addClass(tableClasses.join(' '));

            // update search-size
            const searchWrapper = wrapper.find('.' + bsTableClasses.search + ':first').find('.input-group');
            if (searchWrapper.length) {
                if ($table.hasClass('table-sm')) {
                    searchWrapper.addClass('input-group-sm');
                } else {
                    searchWrapper.removeClass('input-group-sm');
                }
            }

            build.buttons($table);
            const $topPaginationContainer = $(getPaginationContainer($table, true)).empty();
            const $bottomPaginationContainer = $(getPaginationContainer($table, false)).empty();

            const $tableTopContainer = $(getTableTopContainer($table));
            const $btnContainer = $tableTopContainer.find(`.${bsTableClasses.buttons}:first`);


            if ($btnContainer.find('.btn').length && settings.search === true) {
                // we have buttons and a search field, pack Margin
                $btnContainer.addClass('ms-2');
            } else {
                // otherwise remove the margin
                $btnContainer.removeClass('ms-2');
            }

            if (settings.pagination) {
                this.paginationDetails($table, totalRows);
                if (pageSize !== 0) {
                    const $paginationHtml = $(this.pagination($table, totalRows));
                    const showOnTop = ['top', 'both'].includes(settings.paginationVAlign);
                    const showOnBottom = ['bottom', 'both'].includes(settings.paginationVAlign);
                    if (showOnTop) {
                        $topPaginationContainer.append($paginationHtml.clone());
                    }
                    if (showOnBottom) {
                        $bottomPaginationContainer.append($paginationHtml.clone());
                    }
                }
            }
        },
        /**
         * Builds or updates the `<thead>` element of a table based on the given table's settings and configuration.
         * This includes setting up header classes, handling visibility, and populating the header row with columns if applicable.
         *
         * @param {jQuery} $tableElement - The jQuery object representing the table element whose `<thead>` needs to be processed.
         * @param {Array} data - The table data used to populate the tfoot if necessary.
         * @return {void} - This method does not return a value.
         */
        thead($tableElement, data) {
            const $table = $($tableElement);
            const settings = getSettings($table);
            const columns = settings.columns || [];
            const showHeader = columns.length && settings.showHeader === true && !getToggleView($table) && !getToggleCustomView($table);
            const headerClasses = [];
            if (!showHeader) {
                headerClasses.push('d-none')
            }
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('thead')) {
                settings.classes.thead.split(' ').forEach(className => {
                    const name = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(name)) {
                        headerClasses.push(className);
                    }
                });
            }
            if (typeof settings.height !== 'undefined') {
                headerClasses.push('sticky-top');
            }

            const $thead = $($table.children('thead')).empty().addClass(headerClasses.join(' '));
            if (showHeader) {
                $thead.removeClass('d-none');
            }
            const $tr = $('<tr></tr>').appendTo($thead);
            if (showHeader) {

                let colIndex = 0;
                columns.forEach(column => {
                    this.theadTr(column, $tr, colIndex, data);
                    colIndex++;
                });

                if (settings.detailView !== false) {
                    buildDetailView($table, $tr, true);
                }
                if (settings.showCheckItems === true) {
                    buildCheckItem($table, $tr, false, true);
                }

                triggerEvent($table, 'post-header', $thead, $table);
            }
        },
        /**
         * Generates a table header (`<th>`) element for a given column and appends it to the specified table row (`<tr>`).
         * Handles sortable functionality, alignment, visibility, and customizable column styles.
         *
         * @param {Object} column - The column configuration object, containing details like field name, title, width, visibility, and alignment.
         * @param {jQuery} $tr - The jQuery object representing the table row (`<tr>`) where the header cell should be added.
         * @param {number} colIndex - The index of the column in the table, used to uniquely identify the header cell.
         * @param {Array} data - The table data used to populate the tfoot if necessary.
         * @return {void}
         */
        theadTr(column, $tr, colIndex, data) {
            const $table = $($tr).closest('table');
            const settings = getSettings($table);
            const isSortable = column.sortable === true;
            const order = column.field === settings.sortName ? settings.sortOrder ?? '' : '';


            // Create the <th> element
            const $th = $('<th>', {
                'data-sortable': isSortable ? 'true' : 'false',
                'data-field': column.field,
                'data-order': order,
                'data-col-index': colIndex
            }).appendTo($tr);

            const formatterValue = $.bsTable.utils.executeFunction(column.headerFormatter, data, $th);
            const value = !$.bsTable.utils.isValueEmpty(formatterValue) ? formatterValue : (column.title || 'Column ' + (colIndex + 1));
            // If the user has set content, empty the th
            $th.empty();
            // Build inner HTML
            if (isSortable) {
                // If sortable, create the inner structure manually
                const $container = $('<div>', {class: 'd-flex align-items-center justify-content-between'});
                const $title = $('<div>', {class: 'flex-fill me-1', html: value});
                const $icon = $('<div>').append($('<i>', {
                    class: `bs-table-icon ${getIconBySortOrder($table, order)}`
                }));

                $container.append($title).append($icon);
                $th.append($container);

                // Add pointer cursor
                $th.css('cursor', 'pointer');
            } else {
                $th.html(value);
            }

            // Apply CSS and attributes
            if (column.width) {
                $th.css('width', column.width);
            }

            // Build class list
            const alignmentClasses = {
                end: 'text-end',
                right: 'text-end',
                start: 'text-start',
                left: 'text-start',
                center: 'text-center',
                middle: 'text-center'
            };

            const classList = [column.halign && alignmentClasses[column.halign] ? alignmentClasses[column.halign] : '', column.visible === false ? 'd-none' : ''].filter(Boolean);

            if (classList.length) {
                $th.addClass(classList.join(' '));
            }
        },
        /**
         * Updates the tbody of the specified table with the provided rows.
         *
         * @param {jQuery} $tableElement - The jQuery object representing the table whose tbody needs to be updated.
         * @param {Array} rows - An array of data rows to be rendered in the table's tbody.
         * @return {void} - This method does not return a value.
         */
        tbody($tableElement, rows) {
            const $table = $($tableElement);
            const settings = getSettings($table);
            const selected = getSelected($table);
            const expandedElements = getExpanded($table);
            triggerEvent($table, 'pre-body', rows, $table);
            const hasColumns = settings.columns && settings.columns.length;
            const $tbody = $($table.children('tbody')).empty();
            const inToggleView = getToggleView($table);
            const inToggleCustomView = getToggleCustomView($table);
            const hasResponse = rows && rows.length > 0;
            const expandRows = [];

            let bodyClasses = [];
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tbody')) {
                settings.classes.tbody.split(' ').forEach(className => {
                    const classNameTrimmed = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(classNameTrimmed)) {
                        bodyClasses.push(classNameTrimmed);
                    }
                });
            }

            $tbody.addClass(bodyClasses.join(' '));

            if (!hasResponse) {
                const $tr = $('<tr></tr>').appendTo($tbody);
                $('<td>', {
                    colspan: getCountColumns($table),
                    class: 'text-center',
                    html: settings.formatNoMatches(),
                }).appendTo($tr);
            } else if (inToggleCustomView) {
                const $tr = $('<tr></tr>').appendTo($tbody);
                const $td = $('<td>', {
                    colspan: getCountColumns($table),
                }).appendTo($tr);
                triggerEvent($table, 'custom-view', rows, $td);
            } else {
                let trIndex = 0;
                rows.forEach(row => {
                    const $tr = $('<tr>', {
                        'data-index': trIndex,
                    }).appendTo($tbody);
                    if (getToggleView($table)) {
                        $tr.addClass('d-flex flex-column');
                    }
                    $tr.data('row', row);
                    $.bsTable.utils.executeFunction(settings.rowStyle, row, trIndex, $tr);
                    if (hasColumns) {
                        let colIndex = 0;
                        settings.columns.forEach(column => {
                            this.tbodyTd(column, row, $tr, colIndex, inToggleView);
                            colIndex++;
                        });
                        if (settings.detailView !== false) {
                            const expanded = expandedElements.includes(row[settings.detailView.field]);
                            if (expanded) {
                                expandRows.push($tr);
                            }
                            buildDetailView($table, $tr, false);
                        }
                        if (settings.showCheckItems === true) {
                            const checked = selected.some(item => item[settings.checkItemsConfig.field] === row[settings.checkItemsConfig.field]);
                            buildCheckItem($table, $tr, checked, false);
                        }
                    }
                    trIndex++;
                });
                expandRows.forEach(row => {
                    const tdToExpand = row.find('[data-detail-item]');
                    toggleExpandOrCollapse(tdToExpand, false);
                })
            }

            const tableResponsive = $(getResponsiveWrapper($table));

            if (tableResponsive.length) {
                tableResponsive.scrollTop(0);
            }

            // Nur die Daten der aktuellen Seite an onPostBody übergeben
            triggerEvent($table, 'post-body', rows, $table);
        },
        /**
         * Creates and appends a table cell (`td`) to the provided table row (`tr`) while applying cell-specific properties and formatting.
         * This method also handles alignment, visibility, event bindings, and dynamically generates the cell's content based on provided data and configuration.
         *
         * @param {Object} column - The configuration object for the column, containing properties like field, class, align, valign, visible, width, formatter, and events.
         * @param {Object} row - The data object representing the current row.
         * @param {jQuery} $tr - The jQuery object for the table row (`tr`) where the `td` will be appended.
         * @param {number} colIndex - The index of the column in the table.
         * @param {boolean} inToggleView - Indicates whether the table is in toggle view mode, affecting cell width adjustments.
         * @return {void} This method does not return a value.
         */
        tbodyTd(column, row, $tr, colIndex, inToggleView) {
            if (column.field) {
                const trIndex = $($tr).data('index');
                let classList = [];
                if (column.class) {
                    column.class.split(' ').forEach(className => {
                        classList.push(className);
                    });
                }
                if (column.align) {
                    let align = null;
                    if (['end', 'right'].includes(column.align)) {
                        align = 'end';
                    }
                    if (['start', 'left'].includes(column.align)) {
                        align = 'start';
                    }
                    if (['center', 'middle'].includes(column.align)) {
                        align = 'center';
                    }
                    if (null !== align) {
                        classList.push('text-' + align);
                    }
                }
                if (column.valign) {
                    classList.push('align-' + column.valign);
                }


                // Erstelle die `td`-Zelle mit Klassen und Wert
                const $td = $('<td>', {
                    'data-col-index': colIndex, class: classList.join(' '),
                }).appendTo($tr);

                if (inToggleView) {
                    $td.css('width', '100%');
                } else if (column.width) {
                    $td.css('width', column.width);
                }

                if (column.visible === false) {
                    $td.addClass('d-none');
                }

                $td.data('column', column);
                // $td.data('row', row);
                $td.data('trIndex', trIndex);

                let value = row[column.field] ?? ' - ';
                const valueFormatter = $.bsTable.utils.executeFunction(column.formatter, value, row, trIndex, $td);
                if (!$.bsTable.utils.isValueEmpty(valueFormatter)) {
                    value = valueFormatter;
                }

                // Setze den Wert auf die Zelle nur, wenn die Zelle vorher leer war
                if ($td.html().trim() === '') {
                    $td.html(value);
                }

                // When `Events` is defined, register it for the cell
                if (column.events) {
                    for (let [eventSelector, eventHandler] of Object.entries(column.events)) {
                        (function (eventSelector, eventHandler, columnFieldValue, rowData) {
                            const splitEvent = eventSelector.split(' '); // parts according to spaces
                            const selector = splitEvent.pop(); // The last element is the selector (e.g. "Span")
                            const eventTypes = splitEvent.join(' '); // Everything except the selector event types

                            if (selector) {
                                $td.on(eventTypes, selector, function (e) {
                                    eventHandler(e, columnFieldValue, rowData, trIndex);
                                });
                            } else {
                                $td.on(eventTypes, function (e) {
                                    eventHandler(e, columnFieldValue, rowData, trIndex);
                                });
                            }
                        })(eventSelector, eventHandler, row[column.field] ?? null, row);
                    }
                }
            }
        },
        /**
         * Generates and manages the table footer (tfoot) for the given table based on its settings and data.
         *
         * @param {jQuery} $tableElement - The table element to which the tfoot will be applied and updated.
         * @param {Array} data - The table data used to populate the tfoot if necessary.
         * @return {void}
         */
        tfoot($tableElement, data) {
            const $table = $($tableElement);
            const settings = getSettings($table);
            const columns = settings.columns || [];
            const showFooter = columns.length && settings.showFooter === true && !getToggleView($table) && !getToggleCustomView($table);

            const footerClasses = [];
            if (!showFooter) {
                footerClasses.push('d-none')
            }
            if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('tfoot')) {
                settings.classes.tfoot.split(' ').forEach(className => {
                    const classNameTrimmed = className.trim();
                    if (!$.bsTable.utils.isValueEmpty(classNameTrimmed)) {
                        footerClasses.push(classNameTrimmed);
                    }
                })
            }

            if (typeof settings.height !== 'undefined') {
                footerClasses.push('sticky-bottom');
            }

            const $tfoot = $($table.children('tfoot')).empty().addClass(footerClasses.join(' '));

            if (showFooter) {
                $tfoot.removeClass('d-none');
            }

            const $tr = $('<tr></tr>').appendTo($tfoot);

            if (showFooter) {
                let colIndex = 0;
                columns.forEach(column => {
                    this.tfootTr(column, $tr, colIndex, data);
                    colIndex++;
                });

                if (settings.detailView !== false) {
                    buildDetailView($table, $tr, true);
                }

                if (settings.showCheckItems === true) {
                    buildCheckItem($table, $tr, false, true);
                }

                // Nur die Daten der aktuellen Seite an onPostFooter übergeben
                triggerEvent($table, 'post-footer', $tfoot, $table);
            }
        },
        /**
         * Generates a table footer row (`<tr>`) and appends a table header cell (`<th>`) element with the appropriate content and styling based on the provided column configuration.
         *
         * @param {Object} column - The configuration object for the column, including properties for footer formatter, alignment, and visibility.
         * @param {jQuery} $tr - A jQuery object representing the table row (`<tr>`) to which the footer cell (`<th>`) will be appended.
         * @param {number} colIndex - The index of the column in the table.
         * @param {*} data - The data used to evaluate the footer formatter function and generate the footer cell content.
         * @return {void} This method does not return a value; it modifies the DOM by appending a `<th>` element to the provided `<tr>`.
         */
        tfootTr(column, $tr, colIndex, data) {
            // Formatierer-Wert prüfen und zuweisen

            // <th>-Element erstellen
            const $th = $('<th>', {
                'data-col-index': colIndex
            }).appendTo($tr);

            const formatterValue = $.bsTable.utils.executeFunction(column.footerFormatter, data, $th);
            const value = !$.bsTable.utils.isValueEmpty(formatterValue) ? formatterValue : '';
            $th.html(value);
            // Assignment of Alignment Classes
            const alignmentClasses = {
                end: 'text-end',
                right: 'text-end',
                start: 'text-start',
                left: 'text-start',
                center: 'text-center',
                middle: 'text-center'
            };

            // Creating Classes
            const classList = [column.falign && alignmentClasses[column.falign] ? alignmentClasses[column.falign] : '', column.visible === false ? 'd-none' : ''].filter(Boolean);

            // Apply classes, if available
            if (classList.length) {
                $th.addClass(classList.join(' '));
            }
        }
    };


    /**
     * Toggles the visibility of a specific column in a table.
     *
     * @param {jQuery} $tableElement - The jQuery object representing the table in which the column visibility is to be toggled.
     * @param {number} colIndex - The index of the column for which the visibility needs to be toggled.
     * @param {boolean} isVisible - A boolean flag indicating whether the column should be visible.
     *                               When true, the column will be made visible; when false, the column will be hidden.
     * @return {void} No return value.
     */
    function toggleColumnVisibility($tableElement, colIndex, isVisible) {
        const $table = $($tableElement);
        // Selektiert die `th`-Elemente im Header, basierend auf colIndex
        const $theadThs = $($table.children('thead')).children('tr').children(`th[data-col-index="${colIndex}"]`);

        // Selektiert die `td`-Zellen im Body, basierend auf colIndex
        const $tbodyTds = $($table.children('tbody')).children('tr').children(`td[data-col-index="${colIndex}"]`);

        // Selektiert die Zellen im Footer, basierend auf colIndex
        const $tfootCells = $($table.children('tfoot')).children('tr').children(`[data-col-index="${colIndex}"]`);

        // Sichtbarkeit aktualisieren: d-none hinzufügen oder entfernen
        if (isVisible) {
            $theadThs.removeClass('d-none');
            $tbodyTds.removeClass('d-none');
            $tfootCells.removeClass('d-none');
        } else {
            $theadThs.addClass('d-none');
            $tbodyTds.addClass('d-none');
            $tfootCells.addClass('d-none');
        }
    }

    /**
     * Retrieves the appropriate icon based on the given sort order.
     *
     * @param {jQuery} $table - The table reference containing the settings for icons.
     * @param {string} sortOrder - The sort order which can be 'asc', 'desc', or other values.
     * @return {string} The icon corresponding to the provided sort order, or the default icon if the sort order is unrecognized.
     */
    function getIconBySortOrder($table, sortOrder) {
        const {icons} = getSettings($table);
        const iconMap = {
            asc: icons.sortAsc, desc: icons.sortDesc, default: icons.sortNone
        };
        return iconMap[sortOrder] || iconMap.default;
    }

    /**
     * Builds a check item cell (checkbox or indicator) and appends or prepends it to the specified table row.
     *
     * @param {jQuery} $table - The table element where the check item is being created.
     * @param {jQuery} $tr - The table row element to which the check item will be added.
     * @param {boolean} [checked=false] - Flag indicating whether the check item should be marked as checked.
     * @param {boolean} [forHeader=false] - Flag indicating whether the check item is for the table header row.
     * @return {void}
     */
    function buildCheckItem($table, $tr, checked = false, forHeader = false) {
        const settings = getSettings($table);
        if (settings.showCheckItems !== true) {
            return;
        }

        const checkItem = settings.checkItemsConfig;
        let icon;
        if (!forHeader) {
            icon = checked ? settings.icons.check : settings.icons.uncheck;
        } else {
            icon = checked ? settings.icons.checkAll : settings.icons.uncheckAll;
        }

        const classes = [];
        if (['start', 'left'].includes(checkItem.align)) {
            classes.push('text-start');
        } else if (['end', 'right'].includes(checkItem.align)) {
            classes.push('text-end');
        } else {
            classes.push('text-center');
        }
        if (checkItem.valign === 'top') {
            classes.push('align-top');
        } else if (checkItem.valign === 'middle') {
            classes.push('align-middle');
        } else {
            classes.push('align-bottom');
        }

        const $cell = $(forHeader ? '<th></th>' : '<td></td>', {
            class: classes.join(' '),
            css: {
                cursor: 'pointer'
            },
            html: `<i class="${bsTableClasses.checkIcon} ${icon}"></i>`
        });

        if (checkItem.width && checkItem.visible === true) {
            $cell.css('width', checkItem.width);
        }

        if (checkItem.visible !== true) {
            $cell.addClass('d-none');
        }

        if (forHeader) {
            $cell.attr('data-check-item-all', 'false');
        } else {
            $cell.attr('data-check-item', checked ? 'true' : 'false');
        }

        if (checkItem.position === 'start') {
            $cell.prependTo($tr);
        } else {
            $cell.appendTo($tr);
        }
    }

    function buildDetailView($table, $tr, forHeader = false) {
        const settings = getSettings($table);
        if (settings.detailView === false) {
            return;
        }

        const checkItem = settings.detailView;
        let icon;
        if (!forHeader) {
            icon = settings.icons.expand;
        } else {
            icon = 'bi bi-plus-slash-minus';
        }

        const classes = [];
        if (['start', 'left'].includes(checkItem.align)) {
            classes.push('text-start');
        } else if (['end', 'right'].includes(checkItem.align)) {
            classes.push('text-end');
        } else {
            classes.push('text-center');
        }
        if (checkItem.valign === 'top') {
            classes.push('align-top');
        } else if (checkItem.valign === 'middle') {
            classes.push('align-middle');
        } else {
            classes.push('align-bottom');
        }

        const $cell = $(forHeader ? '<th></th>' : '<td></td>', {
            class: classes.join(' '),
            css: {
                cursor: 'pointer'
            },
            html: `<i class="${bsTableClasses.checkIcon} ${icon}"></i>`
        });

        if (checkItem.width && checkItem.visible === true) {
            $cell.css('width', checkItem.width);
        }

        if (checkItem.visible !== true) {
            $cell.addClass('d-none');
        }

        if (forHeader) {
            $cell.attr('data-detail-item-all', 'false');
        } else {
            $cell.attr('data-detail-item', 'false');
        }

        if (checkItem.position === 'start') {
            $cell.prependTo($tr);
        } else {
            $cell.appendTo($tr);
        }
    }

    /**
     * Calculates and returns the number of columns in a given table, optionally considering only visible columns.
     *
     * @param {jQuery} $table - The table for which the column count needs to be determined.
     * @param {boolean} [onlyVisible=true] - Flag indicating whether to count only visible columns. Defaults to true.
     * @return {number} - The total number of columns, including additional columns such as check items if applicable.
     */
    function getCountColumns($table, onlyVisible = true) {
        const settings = getSettings($table);

        if (!settings.columns || !settings.columns.length) {
            return 0;
        }

        let columnCount = settings.columns.filter(column => !onlyVisible || column.visible !== false).length;

        if (settings.showCheckItems !== false) {
            columnCount += 1;
        }

        if (settings.detailView !== false) {
            columnCount += 1;
        }

        return columnCount;
    }

    /**
     * Retrieves the settings object associated with the given table.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {Object} The settings object associated with the table.
     */
    function getSettings($table) {
        return $($table).data('bsTable').settings;
    }

    /**
     * Updates the settings of the given table element.
     *
     * @param {jQuery} $table - The table element as a jQuery object.
     * @param {Object} settings - New settings to be applied to the table.
     * @return {void} This method does not return a value.
     */
    function setSettings($table, settings) {
        const data = $($table).data('bsTable');
        if (data) {
            data.settings = settings;
        }
        $($table).data('bsTable', data);
    }

    /**
     * Retrieves the response data associated with a specified table element.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {Object} An object containing the response data, including `rows` (an array) and `total` (a number).
     */
    function getResponse($table) {
        return $($table).data('bsTable').response || {rows: [], total: 0};
    }

    /**
     * Retrieves the selected items from a table using its bootstrap table instance.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {Array} An array of selected items from the table. If no items are selected, returns an empty array.
     */
    function getSelected($table) {
        return $($table).data('bsTable').selected || []
    }

    /**
     * Retrieves an array of expanded rows from the specified table element.
     *
     * @param {jQuery} $table - The table element from which to retrieve expanded rows.
     * @return {Array} An array containing the expanded rows of the table. If no rows are expanded, returns an empty array.
     */
    function getExpanded($table) {
        return $($table).data('bsTable').expanded || []
    }

    /**
     * Removes the expanded state for a specific row in the table.
     *
     * @param {jQuery} $tableElement - The table element where the operation is performed.
     * @param {Object} row - The row object containing data, including the field to be removed from the expanded list.
     * @return {void} This function does not return any value.
     */
    function removeExpanded($tableElement, row) {
        const $table = $($tableElement);
        const data = $table.data('bsTable');
        const setup = $.bsTable.detailViewDefaults;
        const field = row[setup.field];
        if (data.expanded.includes(field)) {
            data.expanded = data.expanded.filter(item => item !== field);
            $table.data('bsTable', data);
        }
    }

    /**
     * Adds a field of a specified row to the list of expanded fields if it is not already included.
     *
     * @param {jQuery} $tableElement - The table element to which the operation applies.
     * @param {Object} row - The row from which the field to be expanded is derived.
     * @return {void} This function does not return a value.
     */
    function addExpanded($tableElement, row) {
        const $table = $($tableElement);
        const data = $table.data('bsTable');
        const setup = $.bsTable.detailViewDefaults;
        const field = row[setup.field];
        if (!data.expanded.includes(field)) {
            data.expanded.push(field);
            $table.data('bsTable', data);
        }
    }

    /**
     * Adds a selected item to the table's internal selected data, ensuring no duplicates are added.
     *
     * @param {jQuery} $tableElement - The jQuery object representing the table.
     * @param {Object} selected - The object representing the selected item to be added.
     * @return {void} The function does not return any value.
     */
    function addSelected($tableElement, selected) {
        const $table = $($tableElement);
        // Access the table's data
        const data = $table.data('bsTable');
        const checkItemsConfig = data.settings.checkItemsConfig;

        if (data) {
            // Check if the selected item already exists in 'data.selected'
            const exists = data.selected.some(item => item[checkItemsConfig.field] === selected[checkItemsConfig.field]);

            // Add the item only if it doesn't exist
            if (!exists) {
                if (data.settings.debug) {
                    console.log('addSelected', selected);
                }
                data.selected.push(selected);
                if (data.settings.debug) {
                    console.log('newSelected', data.selected);
                }
            }
        }

        // Save the updated data back to the table
        $table.data('bsTable', data);
        build.hiddenSelectedInputs($table);
    }

    /**
     * Removes a selected row from the table's internal data configuration.
     *
     * @param {jQuery} $tableElement jQuery object representing the table element.
     * @param {object} row The row object to be removed from the selected list.
     * @return {void} Does not return a value, updates the table's internal data directly.
     */
    function removeSelected($tableElement, row) {
        const $table = $($tableElement);
        // Retrieve the table's internal data
        const data = $table.data('bsTable');
        const checkItem = data.settings.checkItemsConfig;

        if (data) {
            if (data.settings.debug) {
                console.log('removeSelected', row);
            }

            data.selected = data.selected.filter(item => item[checkItem.field] !== row[checkItem.field]);
            if (data.settings.debug) {
                console.log('newSelected', data.selected);
            }
        }

        // Update the table's data
        $table.data('bsTable', data);
        build.hiddenSelectedInputs($table);
    }

    /**
     * Removes all selected items from the table's internal data and updates the associated selection state.
     *
     * @param {jQuery} $tableElement - The table element wrapped in a jQuery object, which holds the table's internal data and configuration.
     * @return {void} - This method does not return a value. The operation modifies the table's internal state.
     */
    function removeAllSelected($tableElement) {
        const $table = $($tableElement);
        // Retrieve the table's internal data
        const data = $table.data('bsTable');

        if (data) {
            if (data.settings.debug) {
                console.log('removeAllSelected');
            }

            data.selected = [];
            if (data.settings.debug) {
                console.log('newSelected', data.selected);
            }
        }

        // Update the table's data
        $table.data('bsTable', data);
        build.hiddenSelectedInputs($table);
    }

    /**
     * Sets the selected rows for the specified table and updates its internal data.
     *
     * @param {jQuery} $tableElement - The jQuery-wrapped table element to update.
     * @param {Array} rows - An array of rows to mark as selected. If not provided, defaults to an empty array.
     * @return {void} No value is returned from this method.
     */
    function setSelected($tableElement, rows) {
        const $table = $($tableElement);
        const data = $table.data('bsTable');
        if (data) {
            data.selected = rows || [];
        }
        $table.data('bsTable', data);
        build.hiddenSelectedInputs($table);
    }

    /**
     * Updates the response data for a given table element.
     *
     * @param {jQuery} $tableElement - The jQuery reference to the table element.
     * @param {Object} response - The response object to set, containing `rows` and `total` properties. If not provided, a default response with empty rows and zero total is used.
     * @return {void}
     */
    function setResponse($tableElement, response) {
        const $table = $($tableElement);
        const data = $table.data('bsTable');
        if (data) {
            data.response = response || {rows: [], total: 0};
        }
        $table.data('bsTable', data);
    }


    /**
     * Retrieves the toggle view function from a Bootstrap table element.
     *
     * @param {jQuery} $table - A jQuery object representing the Bootstrap table element.
     * @return {boolean} The toggleView true if available, otherwise false.
     */
    function getToggleView($table) {
        return $($table).data('bsTable').toggleView;
    }

    /**
     * Retrieves the toggleCustomView property from the bsTable data of the given table.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {boolean} - The toggleCustomView true if available, otherwise false.
     */
    function getToggleCustomView($table) {
        return $($table).data('bsTable').toggleCustomView;
    }

    function setToggleCustomView($table, toggle) {
        const data = $table.data('bsTable');
        if (data) {
            data.toggleCustomView = toggle;
        }
        $table.data('bsTable', data);
    }

    /**
     * Updates the toggle view state of a Bootstrap table instance.
     *
     * @param {jQuery} $tableElement - The jQuery object representing the table element.
     * @param {boolean} toggleView - A boolean value indicating whether to enable or disable the toggle view.
     * @return {void} This function does not return a value.
     */
    function setToggleView($tableElement, toggleView) {
        const $table = $($tableElement);
        const data = $table.data('bsTable');
        if (data) {
            data.toggleView = toggleView;
        }
        $table.data('bsTable', data);
    }

    /**
     * Retrieves the closest wrapper element surrounding the specified table element.
     *
     * @param {jQuery} $table - A jQuery object representing the table element.
     * @return {jQuery} A jQuery object representing the closest wrapper element.
     */
    function getWrapper($table) {
        return $($table).closest(`.${bsTableClasses.wrapper}`);
    }

    /**
     * Retrieves the closest parent element with the class `wrapperResponsive` for the specified table element.
     *
     * @param {jQuery} $table The jQuery object representing the table element for which the responsive wrapper is to be found.
     * @return {jQuery} A jQuery object representing the closest parent element with the `wrapperResponsive` class.
     */
    function getResponsiveWrapper($table) {
        return $($table).closest(`.${bsTableClasses.wrapperResponsive}`);
    }

    /**
     * Retrieves the closest element with a specific class designated as a wrapper
     * for a given element, starting from its parent's closest matching ancestor.
     *
     * @param {HTMLElement|jQuery} $element - The element for which the closest wrapper should be found.
     *                                        This can be a native DOM element or a jQuery object.
     * @return {jQuery} The closest wrapper element as a jQuery object, or an empty jQuery object
     *                  if no matching wrapper is found.
     */
    function getClosestWrapper($element) {
        return $($element).parent().closest(`.${bsTableClasses.wrapper}`);
    }

    /**
     * Retrieves the bottom container element of the table within its wrapper.
     *
     * @param {jQuery} $table - The jQuery object of the table for which the bottom container is retrieved.
     * @return {jQuery} The jQuery object representing the bottom container element.
     */
    function getTableBottomContainer($table) {
        const $wrapper = $(getWrapper($table)); // Hole den aktuellen Plugin-Wrapper
        return $wrapper.children(`.${bsTableClasses.bottomContainer}`).first();
    }

    /**
     * Retrieves the top container element of a table within the provided wrapper.
     *
     * @param {jQuery} $table - The jQuery object representing the table for which the top container is to be obtained.
     * @return {jQuery} - A jQuery object representing the first top container element found within the wrapper.
     */
    function getTableTopContainer($table) {
        const $wrapper = $(getWrapper($table));
        return $wrapper.children(`.${bsTableClasses.topContainer}`).first();
    }

    /**
     * Retrieves the pagination container element within the specified table.
     *
     * @param {jQuery} $table - The jQuery object representing the target table.
     * @param {boolean} top - A boolean indicating whether to retrieve the top pagination container (true)
     *                        or the bottom pagination container (false).
     *
     * @return {jQuery} Returns the jQuery object representing the pagination container element.
     */
    function getPaginationContainer($table, top) {
        if (top) {
            return $(getTableTopContainer($table)).find('.' + bsTableClasses.pagination);
        } else {
            return $(getTableBottomContainer($table)).find('.' + bsTableClasses.pagination);
        }
    }


    /**
     * Retrieves the search input element is directly associated with the given table.
     *
     * @param {jQuery} $table - The jQuery-wrapped table element for which the search input is to be found.
     * @return {jQuery} - The jQuery-wrapped search input element if found, or an empty jQuery object if no associated input is found.
     */
    function getSearchInput($table) {
        const $wrapper = $(getWrapper($table)); // Hole den aktuellen Plugin-Wrapper

        // Finde den einzigen Such-Input im Wrapper, aber ignoriere Inputs aus untergeordneten Wrappers
        const $searchInput = $wrapper.find('.' + bsTableClasses.searchInput).filter(function () {
            // Stelle sicher, dass der Input direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur den ersten gefilterten Input holen (falls mehr als einer gefunden wird)

        return $searchInput.length > 0 ? $searchInput : $(); // Fallback: leeres jQuery-Objekt, falls nichts gefunden
    }


    /**
     * Retrieves the overlay element associated with the provided table element.
     * This method ensures that only the overlay directly belonging to the current
     * wrapper of the table is returned, ignoring overlays in nested wrappers.
     *
     * @param {jQuery} $table - The jQuery object representing the table element for which the overlay is searched.
     * @return {jQuery} A jQuery object containing the overlay element, or an empty jQuery object if no overlay is found.
     */
    function getOverlay($table) {
        const $wrapper = $(getWrapper($table)); // get the current plugin wrapper

        // Find the overlay in the current wrapper, ignore overlays in nested wrappers
        const $overlay = $wrapper.find('.' + bsTableClasses.overlay).filter(function () {
            // check whether this overlay is located directly in the current wrapper
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // only get the first overlay (if several are found)

        return $overlay.length > 0 ? $overlay : $(); // Fallback: empty jQuery object if no overlay has been found
    }


    /**
     * Handles the sorting functionality for a table header (`<th>`).
     * Updates the sort state of the specified header and resets other sortable headers in the table.
     * Triggers the sorting event and refreshes the table with the new sort order and field.
     *
     * @param {jQuery} $thElement - The jQuery object representing the table header element (`<th>`) to sort on.
     * @return {void} This function does not return a value.
     */
    function handleSortOnTheadTh($thElement) {
        const $th = $($thElement);
        const wrapper = $(getClosestWrapper($th));
        const $table = $(getTableByWrapperId(wrapper.attr('id')));
        const settings = getSettings($table);
        const allSortableHeaders = $table.find('thead:first th[data-sortable="true"]')
        const filteredHeaders = allSortableHeaders.not($th);

        filteredHeaders.each(function (i, el) {
            const $otherTh = $(el);
            $otherTh.attr('data-order', '');
            const $icon = $otherTh.find('i.bs-table-icon');
            $icon.removeClass(settings.icons.sortNone);
            $icon.removeClass(settings.icons.sortAsc);
            $icon.removeClass(settings.icons.sortDesc);
            $icon.addClass(settings.icons.sortNone);
        });

        if ($th.length > 0) {
            let order = $th.attr('data-order');
            if (order === 'asc') {
                order = 'desc';
            } else if (order === 'desc') {
                order = '';
            } else {
                order = 'asc';
            }
            const $iconCurrent = $th.find('i.bs-table-icon');
            const field = $th.attr('data-field');
            $iconCurrent.removeClass(settings.icons.sortNone);
            $iconCurrent.removeClass(settings.icons.sortAsc);
            $iconCurrent.removeClass(settings.icons.sortDesc);
            $th.attr('data-order', order);
            settings.sortOrder = order === '' ? null : order;
            settings.sortName = field;
            settings.pageNumber = 1;

            switch (order) {
                case 'asc': {
                    $iconCurrent.addClass(settings.icons.sortAsc);
                }
                    break;
                case 'desc': {
                    $iconCurrent.addClass(settings.icons.sortDesc);
                }
                    break;
                default: {
                    $iconCurrent.addClass(settings.icons.sortNone);
                }
            }
        } else {
            settings.sortOrder = null;
            settings.sortName = null;
        }

        triggerEvent($table, 'sort', settings.sortName, settings.sortOrder);
        setSettings($table, settings);
        refresh($table);
    }

    /**
     * Handles click events on a table cell and its related row.
     *
     * This function processes clicks on any cell except those belonging to "check items".
     * It triggers the corresponding row and cell click events (custom and native),
     * and, if enabled in settings, can also toggle the check item when the row is clicked.
     *
     * @param {jQuery} $tdElement - The table cell (<td>) that was clicked.
     */
    function onClickCellAndRow($tdElement) {
        const $td = $($tdElement);


        // Ignore this click if the cell is a check item cell (checkbox/radio)
        if ($td.attr('data-check-item') || $td.attr('data-detail-item')) {
            return;
        }

        // Get the wrapper and the corresponding table for the clicked cell
        const $wrapper = $(getClosestWrapper($td));
        const $table = $(getTableByWrapperId($wrapper.attr('id')));
        // Retrieve table settings
        const settings = getSettings($table);

        // Get the column configuration for this cell (e.g. field name)
        const column = $td.data('column');
        // Find the whole row element and get its data record
        const $tr = $td.closest('tr');
        const row = $tr.data('row');

        // Safely get the cell value from the row data (or null if undefined)
        const value = row[column.field] ?? null;

        // === TRIGGER EVENTS/CALLBACKS ===


        // Fire the 'click-row' event and user callback (row, $tr, field)
        triggerEvent($table, 'click-row', row, $tr, column.field);

        // Fire the 'click-cell' event and user callback (field, value, row, $td)
        triggerEvent($table, 'click-cell', column.field, value, row, $td);

        // === OPTIONAL: Select row when clicking anywhere in the row, if enabled ===
        // If table uses check items and row click should trigger selection
        if (settings.showCheckItems === true && settings.checkItemsConfig.clickRowToSelect === true) {
            // Locate the check item cell in this row
            const $checkTd = $tr.find('td[data-check-item]:first');
            // Simulate a click on the check item to synchronize selection
            handleCheckItemClicked($checkTd);
        }

        if (settings.detailView !== false && settings.detailView.clickRowToToggle === true) {
            const $checkTd = $tr.find('td[data-detail-item]:first');
            toggleExpandOrCollapse($checkTd, true);
        }
    }

    /**
     * Triggers a custom and a namespaced event on a given Bootstrap table element.
     *
     * This function is designed for internal use within the bsTable plugin to propagate table-specific events.
     * It will trigger the named event (with bsTable namespace) on the provided $table, sending extra context
     * data (such as whether it's a child table or has sub-tables) via the event `bsTable` property.
     *
     * Unless the triggered event is 'all', it also triggers the generic 'all' event for global listeners.
     *
     * @param {jQuery} $tableElement         - jQuery object representing the table element.
     * @param {string} eventName      - The name of the event to trigger (without namespace).
     * @param {...any} args           - Additional arguments that should be passed to event handlers.
     */
    function triggerEvent($tableElement, eventName, ...args) {
        const $table = $($tableElement);
        // Get the native DOM element of the table
        const targetTable = $table[0];

        // Retrieve the current bsTable settings for this table
        const settings = getSettings($table);

        // Determine if this table is a subtable (within a child wrapper)
        const isSubTable = $table.closest(`.${bsTableClasses.wrapper}[data-child="true"]`).length > 0;

        // Determine if this table contains any sub-tables (children)
        const hasSubTables = $(getClosestWrapper($table)).find(`.${bsTableClasses.wrapper}[data-child="true"]`).length > 0;

        // Compose event-specific table data for event consumers
        const bsTableDatas = {
            table: targetTable,
            settings: settings,
            isChildTable: isSubTable,
            hasChildTables: hasSubTables,
        };

        // Create a jQuery event object with namespace and attach table context
        const event = $.Event(eventName + namespace, {
            target: targetTable,
            bsTable: bsTableDatas,
        });

        // Trigger the event on the table with any extra arguments
        $table.trigger(event, args);

        // Prevent the event from bubbling up the DOM
        event.stopPropagation();

        // Unless this is the generic 'all' event, fire 'all' for global event listeners too
        if (eventName !== 'all') {
            const allEvent = $.Event(`all${namespace}`, {target: targetTable});
            $table.trigger(allEvent, [eventName + namespace, ...args]);
            $.bsTable.utils.executeFunction(settings.onAll, eventName + namespace, ...args);
            allEvent.stopPropagation();

            // Automatically map the event name to a settings handler and execute it
            // Convert event name to CamelCase + add "on" prefix (e.g., "show-info-window" -> "onShowInfoWindow")
            const eventFunctionName = `on${eventName
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join('')}`;

            $.bsTable.utils.executeFunction(settings[eventFunctionName], ...args);
        }
    }


    /**
     * Retrieves a table element that has a specific data-wrapper attribute matching the provided wrapper ID.
     *
     * @param {string} wrapperId - The ID of the wrapper to search for in the data-wrapper attribute of the table.
     * @return {jQuery} A jQuery object representing the table element with the matching data-wrapper attribute.
     */
    function getTableByWrapperId(wrapperId) {
        return $(`table[data-wrapper="${wrapperId}"`);
    }

    /**
     * Handles the click event for changing the pagination size of a table.
     *
     * @param {jQuery} $table - The jQuery object representing the table element.
     * @param {jQuery} $aTag - The jQuery object representing the clicked pagination size anchor element.
     * @return {void} This function does not return a value.
     */
    function handleClickOnPaginationSize($table, $aTag) {
        const $a = $($aTag)
        const settings = getSettings($table);
        const response = getResponse($table);
        settings.pageSize = parseInt($a.data('page'));
        const totalRows = response.total;
        const maxPageNumber = Math.ceil(totalRows / settings.pageSize);

        if (settings.pageNumber > maxPageNumber) {
            console.warn(`Page ${settings.pageNumber} is invalid. Falling back to last page (${maxPageNumber}).`);
            settings.pageNumber = maxPageNumber;
        }

        setSettings($table, settings);
        refresh($table);
    }

    /**
     * Handles the click event on a check item (checkbox or radio button) within the table.
     *
     * This function determines which table and row were clicked, then updates the checked state for that row
     * and the table's selection data accordingly. It also updates the icon and row-class in the DOM,
     * and triggers the relevant check/uncheck events and callbacks.
     *
     * @param {jQuery} $tdElement - The table cell (`<td>`) that was clicked
     */
    function handleCheckItemClicked($tdElement) {
        const $td = $($tdElement);
        // Get the outer wrapper element associated with this cell
        const $wrapper = $(getClosestWrapper($td));
        // Get the related table using the wrapper's ID
        const $table = $(getTableByWrapperId($wrapper.attr('id')));
        // Retrieve current settings for this table
        const settings = getSettings($table);
        // Exit if check items are not enabled
        if (settings.showCheckItems !== true) {
            return;
        }

        let checked = false; // Will indicate if this row will be selected after this function
        // Get configuration for check/radio items
        const checkItemConfig = settings.checkItemsConfig;
        // Find the table row and its associated data
        const $tr = $td.closest('tr');
        const row = $tr.data('row');

        if (checkItemConfig.type === 'radio') {
            // For radio buttons: only one row can be selected
            removeAllSelected($table);
            addSelected($table, row);
            checked = true;
        } else {
            // Retrieve current array of selected rows
            const selectedRows = getSelected($table);
            // For checkboxes: toggle selection for the clicked row
            // Compare over the configured field (typically an ID or unique key)
            const isSelected = selectedRows.some(selected => selected[checkItemConfig.field] === row[checkItemConfig.field]);
            if (isSelected) {
                // If already selected, remove selection
                removeSelected($table, row);
            } else {
                // Otherwise, select the row
                checked = true;
                addSelected($table, row);
            }
        }

        // Trigger the relevant event and execute callback for check/uncheck
        if (checked) {
            triggerEvent($table, 'check', row, $td);
        } else {
            triggerEvent($table, 'uncheck', row, $td);
        }
    }

    function toggleExpandOrCollapse($tdElement, trigger = true) {
        const $td = $($tdElement);
        // Get the outer wrapper element associated with this cell
        const $wrapper = $(getClosestWrapper($td));
        // Get the related table using the wrapper's ID
        const $table = $(getTableByWrapperId($wrapper.attr('id')));
        // Retrieve current settings for this table
        const settings = getSettings($table);
        // Exit if check items are not enabled
        if (settings.detailView === false) {
            return;
        }

        const $icon = $td.find(`.${bsTableClasses.checkIcon}`).removeClass(settings.icons.expand).removeClass(settings.icons.collapse);

        let expanded = $td.attr('data-detail-item') === 'true'; // Will indicate if this row will be selected after this function
        // Get configuration for check/radio items
        const checkItemConfig = settings.detailView;
        // Find the table row and its associated data
        const $tr = $td.closest('tr');
        const row = $tr.data('row');

        if (expanded) {
            $icon.addClass(settings.icons.expand);
            $td.attr('data-detail-item', 'false');
            const $oldTd = $($tr.next().children('td'));
            if (trigger) {
                triggerEvent($table, 'collapse-row', row, $td);
            }
            $tr.next().remove();
            removeExpanded($table, row);
        } else {
            $icon.addClass(settings.icons.collapse);
            addExpanded($table, row);
            $td.attr('data-detail-item', 'true');
            const newTr = $('<tr>').insertAfter($tr);

            const $newTd = $('<td>', {
                colspan: getCountColumns($table)
            }).appendTo(newTr);
            $.bsTable.utils.executeFunction(checkItemConfig.formatter,$tr.attr('data-index'), row, $newTd);
            // checkItemConfig.formatter($tr.attr('data-index'), row, $newTd);
            if (trigger) {
                triggerEvent($table, 'expand-row', row, $td);
            }
        }
    }

    /**
     * Executes a search operation by retrieving settings and refreshing the associated table.
     *
     * @param {jQuery} $wrapper - The DOM wrapper element containing the table's identifier.
     * @return {void} No return value.
     */
    function performSearch($wrapper) {
        const table = getTableByWrapperId($($wrapper).attr('id'));
        const settings = getSettings(table);
        settings.pageNumber = 1;
        setSettings(table, settings);
        refresh(table); // Tabelle aktualisieren
    }

    /**
     * Handles the event when the "Check All" checkbox or control is clicked.
     * Toggles the selection state of all items in the related table based on the checkbox state.
     *
     * @param {jQuery} $thElement The jQuery object representing the header or control element that triggered the event.
     * @return {void} No return value.
     */
    function handleCheckItemAllClicked($thElement) {
        const $th = $($thElement);
        const checkAll = $th.attr('data-check-item-all') === 'false';
        // Get the outer wrapper element associated with this cell
        const $wrapper = $(getClosestWrapper($th));
        // Get the related table using the wrapper's ID
        const $table = $(getTableByWrapperId($wrapper.attr('id')));
        // Retrieve current settings for this table
        const settings = getSettings($table);
        // Exit if check items are not enabled
        if (settings.showCheckItems !== true) {
            return;
        }
        const checkItemConfig = settings.checkItemsConfig;
        if (checkItemConfig.type === 'radio' && checkAll) {
            return;
        }
        const rows = getResponse($table).rows;
        rows.forEach(row => {
            if (checkAll) {
                addSelected($table, row);
            } else {
                removeSelected($table, row);
            }
        });
    }


    /**
     * Registers global table-related event listeners that handle various actions
     * such as clicks, changes, input events, and more for elements associated
     * with table management. These events are delegated to the parent `document`
     * object and target specific table elements based on class and attribute selectors.
     *
     * The registered events include:
     * - Handling click and selection on table rows, cells, and headers.
     * - Managing actions such as sorting, pagination, and search.
     * - Supporting custom table views and refresh operations.
     * - Preventing default behaviors when interacting with specific elements.
     *
     * @return {void} This function does not return a value.
     */
    function registerGlobalTableEvents() {
        let searchTimeout;
        const preventDefault = (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
        // Delegiere Events an ein Eltern-Element, z. B. `document`:
        $(document)
            .on([
                'click' + namespace,
                'change' + namespace,
                'input' + namespace,
                'touchstart' + namespace,
                'mouseenter' + namespace
            ].join(' '), '.' + bsTableClasses.wrapper, function (e) {
                const $target = $(e.currentTarget);

                // Stelle sicher, dass nur das äußerste Element Events erhält
                if ($target.parents('.' + bsTableClasses.wrapper).length > 0) {
                    // noinspection UnnecessaryReturnStatementJS
                    return; // Ignoriere verschachtelte `bsTableClasses.wrapper`
                }

                // register events for the outer `.bsTableClasses.wrapper`
                // Depending on the type of event, you can differentiate here if necessary.
            })
            .on([
                'click' + namespace,
                'change' + namespace,
                'touchstart' + namespace,
                'mouseenter' + namespace
            ].join(' '), `.${bsTableClasses.wrapper} [data-child="true"]`, function (e) {
                preventDefault(e);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} tbody > tr[data-index] > td:not([data-check-item],[data-detail-item])`, function (e) {
                // Check whether the target is a link, button, input, textarea or select
                if (
                    e.target.tagName === 'A' || $(e.target).closest('a').length > 0 ||
                    e.target.tagName === 'BUTTON' || $(e.target).closest('button').length > 0 ||
                    e.target.tagName === 'INPUT' || $(e.target).closest('input').length > 0 ||
                    e.target.tagName === 'TEXTAREA' || $(e.target).closest('textarea').length > 0 ||
                    e.target.tagName === 'SELECT' || $(e.target).closest('select').length > 0
                ) {
                    return; // do nothing if a link, button, input, textarea or select was clicked
                }
                const selection = window.getSelection().toString();
                if (selection) {
                    return;
                }

                //Do not react to double click
                if (e.detail && e.detail > 1) {
                    return;
                }

                preventDefault(e);
                onClickCellAndRow($(e.currentTarget));
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} tbody td[data-check-item]`, function (e) {
                preventDefault(e);
                handleCheckItemClicked($(e.currentTarget));
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} tbody td[data-detail-item]`, function (e) {
                preventDefault(e);
                toggleExpandOrCollapse($(e.currentTarget));
            })
            .on('click' + namespace, [
                `.${bsTableClasses.wrapper} thead th[data-check-item-all]`,
                `.${bsTableClasses.wrapper} tfoot th[data-check-item-all]`
            ].join(', '), function (e) {
                preventDefault(e);
                handleCheckItemAllClicked($(e.currentTarget));
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} thead th[data-sortable="true"]`, function (e) {
                preventDefault(e);
                handleSortOnTheadTh($(e.currentTarget));
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} [data-role="tablePaginationPageSize"] .dropdown-item`, function (e) {
                preventDefault(e);
                const $a = $(e.currentTarget);
                if (!$a.length) {
                    return;
                }
                const wrapper = $(getClosestWrapper($a));
                const table = $(getTableByWrapperId(wrapper.attr('id')));
                handleClickOnPaginationSize(table, $a);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnRefresh}`, function (e) {
                preventDefault(e);
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = $(getClosestWrapper($btn));
                const table = $(getTableByWrapperId($wrapper.attr('id')));
                refresh(table, null, true);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnToggle}`, function (e) {
                preventDefault(e);
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = $(getClosestWrapper($btn));
                const table = $(getTableByWrapperId($wrapper.attr('id')));
                toggleView(table);
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.btnCustomView}`, function (e) {
                preventDefault(e);
                const $btn = $(e.currentTarget);
                if (!$btn.length) {
                    return;
                }
                const $wrapper = $(getClosestWrapper($btn));
                const table = $(getTableByWrapperId($wrapper.attr('id')));
                toggleCustomView(table);
            })
            .on('input' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.searchInput}`, function (e) {
                preventDefault(e);
                const $searchField = $(e.currentTarget);
                if (!$searchField.length) {
                    return;
                }
                const wrapper = getClosestWrapper($searchField);

                clearTimeout(searchTimeout);

                searchTimeout = setTimeout(() => {
                    performSearch(wrapper);
                }, 600);

                if (e.key === "Enter") {
                    e.preventDefault(); // Prevent default behavior (e.g., form submit)
                    clearTimeout(searchTimeout);
                    performSearch(wrapper);
                }
            })
            .on('click' + namespace, `.${bsTableClasses.wrapper} .${bsTableClasses.pagination} .page-link`, function (e) {
                preventDefault(e);

                const $pageLink = $(e.currentTarget);

                if (!$pageLink.length) {
                    return;
                }


                const wrapper = $(getClosestWrapper($pageLink)); // Funktion vorhanden
                const table = $(getTableByWrapperId(wrapper.attr('id')));
                const settings = getSettings(table);
                const response = getResponse(table);

                // Berechnung der Seitenanzahl basierend auf der Antwort
                const totalPages = Math.ceil(response.total / settings.pageSize);

                // Verhindere Aktion, wenn der Link deaktiviert oder bereits aktiv ist
                if ($pageLink.parent().hasClass('disabled') || $pageLink.parent().hasClass('active')) {
                    return;
                }

                // Aktion vom Link holen
                const action = $pageLink.attr('data-role') || $pageLink.html().toLowerCase().trim();

                // Navigation Aktionen ausführen (vorherige, nächste oder spezifische Seite)
                if (action.includes('previous') || action.includes('left')) {
                    settings.pageNumber = Math.max(1, settings.pageNumber - 1);
                } else if (action.includes('next') || action.includes('right')) {
                    settings.pageNumber = Math.min(totalPages, settings.pageNumber + 1);
                } else {
                    const pageNum = parseInt($pageLink.text().trim(), 10);
                    if (!isNaN(pageNum)) {
                        settings.pageNumber = pageNum;
                    }
                }

                // Speichere die neuen Einstellungen und lade/aktualisiere den Tabelleninhalt
                setSettings(table, settings);
                refresh(table);
            });

        $.bsTable.globalEventsBound = true;
    }

}(jQuery))
