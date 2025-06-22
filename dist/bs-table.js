(function ($) {
    "use strict";

    $.bsTable = {
        defaults: {
            classes: 'table',
            toolbar: null,
            pagination: true,
            sidePagination: 'server',
            paginationVAlign: 'bottom',
            paginationHAlign: 'end',
            pageNumber: 1,
            search: true,
            pageSize: 10,
            pageList: [10, 25, 50, 100, 200, 'All'],
            showRefresh: true,
            showHeader: true,
            showFooter: true,
            url: null,
            data: null,
            columns: [],
            rowStyle(row, index, $tr) {
            },
            queryParams(params) {
                return params;
            },
            responseHandler(res) {
                return res;
            },
            onLoadSuccess() {
            },
            onLoadError() {
            },
            onPageChange() {
            },
            onPostBody() {
            },
            formatNoMatches() {
                return `<i class="bi bi-x-lg fs-3"></i>`
            }
        }
    };

    const wrapperClass = 'bs-table-wrapper';
    const wrapperTableClass = 'bs-table-inner-wrapper';
    const wrapperOverlayClass = 'bs-table-wrapper-overlay';
    const wrapperSearchClass = 'bs-table-wrapper-search';
    const wrapperPaginationClass = 'bs-table-pagination-container';
    const inputSearchClass = 'bs-table-search-input';
    const namespace = '.bs.table';

    $.fn.bsTable = function (optionsOrMethod, ...args) {
        if ($(this).length === 0) {
            return;
        }
        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).bsTable(optionsOrMethod, ...args);
            });
        }

        const $table = $(this);
        if (!$table.data('bsTable')) {
            const options = typeof optionsOrMethod === 'object' ? optionsOrMethod : {};
            const bsTable = {
                settings: $.extend(true, {}, $.bsTable.defaults, $table.data() || {}, options),
            };
            $table.data('bsTable', bsTable);
            buildTable($table);
            events($table);
        }
        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'showLoading':
                    showLoading($table);
                    break;
                case 'hideLoading':
                    hideLoading($table);
                    break;
                case 'refresh':
                    const arg = args.length ? args[0] : null;
                    refresh($table, arg);
                    break;
            }
        }

        return $table;
    };

    function refresh($table, options = null) {
        const settings = getSettings($table);
        let silent = false;
        let pageNumber = settings.pageNumber ?? 1;
        let pageSize = settings.pageSize ?? 10;
        let url = settings.url;
        let update = false;

        if (options && typeof options === 'object') {
            if (options.hasOwnProperty('silent')) {
                silent = options.silent;
            }
            if (options.hasOwnProperty('pageNumber')) {
                pageNumber = Math.max(1, options.pageNumber);
                update = true;
            }
            if (options.hasOwnProperty('pageSize')) {
                pageSize = options.pageSize;
                update = true;
            }
            if (options.hasOwnProperty('url')) {
                url = options.url;
                update = true;
            }
        }

        if (update) {
            settings.pageNumber = pageNumber;
            settings.pageSize = pageSize;
            setSettings($table, settings);
        }

        // Daten abrufen
        fetchData($table, url, silent).then(response => {
            const totalRows = response.total || 0; // Gesamte Anzahl der Zeilen (z. B. aus der API)

            // Maximale Anzahl der Seiten basierend auf totalRows und pageSize
            const maxPages = Math.ceil(totalRows / pageSize);

            // Überprüfen, ob die aktuelle pageNumber die maxPages übersteigt
            if (pageNumber > maxPages) {
                console.warn(`Page number ${pageNumber} exceeds the maximum number of pages (${maxPages}). Resetting to last page.`);
                pageNumber = maxPages; // Auf die letzte Seite setzen
                settings.pageNumber = pageNumber;
                setSettings($table, settings);
            }

            // Tabelle rendern oder aktualisieren
            renderTable($table, silent);
        });
    }

    function fetchData($table) {
        return new Promise((resolve, reject) => {
            const settings = getSettings($table);
            const wrapper = getWrapper($table);
            if (!settings.url && !(settings.data && Array.isArray(settings.data))) {
                reject(new Error("Es wurde weder eine URL noch lokale Daten konfiguriert."));
                return;
            }

            const searchInput = getSearchInput($table);
            if (searchInput.length) {
                searchInput.removeClass('is-invalid is-valid');
            }
            let searchInputValue = null;
            let isSearching = false;

            let params = {};
            if (settings.pagination) {
                params.limit = settings.pageSize; // Anzahl der Elemente pro Seite
                params.offset = (settings.pageNumber - 1) * settings.pageSize; // Offset basierend auf aktueller Seite
            }
            if (settings.search) {
                searchInputValue = searchInput.val().trim();
                isSearching = !isValueEmpty(searchInputValue);
                params.search = !isSearching ? null : searchInputValue;
            }

            if (typeof settings.queryParams === "function") {
                params = settings.queryParams(params); // Zusätzliche Parameter hinzufügen
            }

            // Lokale Daten verarbeiten
            if (Array.isArray(settings.data) && settings.data.length > 0) {
                const total = settings.data.length;
                const start = params.offset || 0;
                const end = start + (params.limit || total);

                // Wenn searchValue leer ist, alle Daten verwenden, sonst filtern
                const filteredData = !isValueEmpty(searchInputValue)
                    ? settings.data.filter(row =>
                        Object.values(row).some(value =>
                            value.toString().toLowerCase().includes(searchInputValue.toLowerCase())
                        )
                    )
                    : settings.data;

                // Gesamtanzahl der gefilterten Daten
                const filteredTotal = filteredData.length;
                if (isSearching) {
                    searchInput.addClass(filteredTotal ? 'is-valid' : 'is-invalid');
                }

                // Speichert die gefilterten Daten im jQuery-Objekt `$table`
                $table.data('response', {rows: filteredData, total: filteredTotal});

                resolve({
                    rows: filteredData.slice(start, end), // Aktuelle Seite der ausgewählten Daten
                    total: filteredTotal,
                });

                return;
            }

            // Daten aus einer URL abrufen
            if (typeof settings.url === "string") {
                $.ajax({
                    url: settings.url,
                    method: "GET",
                    data: params,
                    dataType: "json",
                })
                    .done((response) => {
                        let processedData;
                        // Prüfen, ob die API ein Array oder ein Objekt zurückgibt
                        if (Array.isArray(response)) {
                            processedData = {
                                rows: response,
                                total: response.length,
                            };
                        } else {
                            processedData = {
                                rows: response.rows || [],
                                total: response.total || 0,
                            };
                        }

                        // Speichert den gesamten `response` im jQuery-Objekt `$table`
                        $table.data('response', processedData);

                        if (isSearching) {
                            searchInput.addClass(processedData.total ? 'is-valid' : 'is-invalid');
                        }

                        resolve(processedData); // Liefert die aktuellen Daten zurück
                    })
                    .fail((xhr, textStatus, errorThrown) => {
                        reject(new Error(`Fehler: ${textStatus}, ${errorThrown}`));
                    });
                return;
            }

            reject(new Error("Ungültige Konfiguration: Weder 'url' noch 'data' gefunden."));
        });
    }

    function buildTable($table) {
        $table.empty(); // Tabelle leeren
        const settings = getSettings($table);

        // Erstelle den Haupt-Wrapper
        const $wrapper = $('<div class="' + wrapperClass + ' position-relative"></div>').insertAfter($table);

        let tableClasses = '';
        if (typeof settings.classes === 'string') {
            tableClasses = settings.classes;
        } else if (typeof settings.classes === 'object') {
            tableClasses = settings.classes.table;
        }

        // Erstelle den scrollbaren `table-responsive` Bereich
        const $tableResponsiveWrapper = $('<div class="position-relative"></div>').appendTo($wrapper);
        $table.appendTo($tableResponsiveWrapper);

        // **Neuer Table-Top-Container inkl. Pagination und Suche**
        const $tableTopContainer = $('<div class="mb-3 d-flex flex-column gap-2"></div>').prependTo($wrapper);
        const $tableTopContainerFirstRow = $('<div class="d-flex justify-content-end gap-2"></div>').appendTo($tableTopContainer);
        const $tableTopContainerSecondRow = $('<div class="d-flex justify-content-between gap-2"></div>').appendTo($tableTopContainer);
        // Falls ein Toolbar-Element definiert ist
        if (settings.toolbar && $(settings.toolbar).length > 0) {
            $(settings.toolbar).prependTo($tableTopContainerFirstRow);
        } else {
            $('<div>').appendTo($tableTopContainerFirstRow);
        }


        // Such-Wrapper erstellen (links)
        const $searchWrapper = $('<div class="' + wrapperSearchClass + '"></div>').appendTo($tableTopContainerFirstRow);

        const $locationWrapper = $('<div>').prependTo($tableTopContainerSecondRow)

        // Pagination-Container oben einfügen (rechts)

        const $paginationContainerTop = $(`<div class="${wrapperPaginationClass} top d-flex justify-content-end"></div>`);
        if (['right', 'end'].includes(settings.paginationHAlign)) {
            $paginationContainerTop.appendTo($tableTopContainerSecondRow);
        } else {
            $paginationContainerTop.appendTo($tableTopContainerSecondRow);
        }

        // Pagination-Container unten einfügen
        const $paginationContainerBottom = $(`<div class="${wrapperPaginationClass} bottom d-flex justify-content-end"></div>`).appendTo($wrapper);

        // Falls die Suche aktiviert ist, füge ein Input-Feld und Logik hinzu
        if (settings.search === true) {
            const $searchInputGroup = $(`
    <div class="input-group">
        <span class="input-group-text"><i class="bi bi-search"></i></span>
        <input type="search" class="form-control ${inputSearchClass}" placeholder="...">
    </div>
`);
            $searchInputGroup.appendTo($searchWrapper);
        }

        if (settings.showRefresh) {
            const $refreshButton = $(`<button>`, {
                class: 'btn btn-secondary',
                html: '<i class="bi bi-arrow-repeat"></i>',
                title: 'Refresh',
                'data-role': 'refresh',
            }).appendTo($tableTopContainerFirstRow);
        }

        // Grundklassen an die Tabelle anwenden
        $table.addClass(tableClasses);
        $('<thead></thead>').appendTo($table);
        $('<tbody></tbody>').appendTo($table);
        $('<tfoot></tfoot>').appendTo($table);


        // Generiere Header (basierend auf Spalten)
        buildTableHeader($table, settings.columns);
        refresh($table)
    }

    function hideLoading($table) {
        const $overlay = getOverlay($table);
        $overlay.remove();
    }

    function showLoading($table) {
        const settings = getSettings($table);

        const wrapper = getWrapper($table);
        // Entferne vorhandenes Overlay, falls es existiert
        hideLoading($table);

        // Anzahl der Zeilen und Spalten basierend auf den Einstellungen
        const columnCount = settings.columns.length;
        const rowCount = settings.pageSize;

        // Overlay generieren
        const $overlay = $('<div>', {
            class: wrapperOverlayClass + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center opacity-75 bg-body',
            css: {
                zIndex: 4,
            }
        }).appendTo(wrapper);

        // // Placeholder-Struktur erstellen
        const $content = $(`
<div class="spinner-border"  style="width: 3rem; height: 3rem;"   role="status">
  <span class="visually-hidden">Loading...</span>
</div>`).appendTo($overlay);
    }

    function renderTable($table, silent = false) {
        const settings = getSettings($table);
        const response = $table.data('response') || {rows: [], total: 0};
        const totalRows = response.total || (response.rows ? response.rows.length : 0);
        const pageSize = settings.pageSize;
        const pageNumber = settings.pageNumber;
        let currentPageData = response.rows;
        if (settings.sidePagination === 'client') {
            const start = (pageNumber - 1) * pageSize;
            const end = start + pageSize;
            currentPageData = response.rows.slice(start, end);
        }

        if (settings.columns && settings.columns.length) {
            buildTableHeader($table, settings.columns);
            buildTableBody($table, currentPageData);
            buildTableFooter($table, settings.columns, response.rows);
        }

        const $topPaginationContainer = getPaginationContainer($table, true).empty();
        const $bottomPaginationContainer = getPaginationContainer($table, false).empty();

        if (settings.pagination && currentPageData.length) {
            const $wrapper = getWrapper($table);

            const $paginationHtml = createPagination($table, totalRows);

            if (settings.paginationVAlign === 'top' || settings.paginationVAlign === 'both') {
                $topPaginationContainer.append($paginationHtml.clone());
            }

            if (settings.paginationVAlign === 'bottom' || settings.paginationVAlign === 'both') {
                $bottomPaginationContainer.append($paginationHtml.clone());
            }
        }

        // Nur die Daten der aktuellen Seite an onPostBody übergeben
        $table.trigger(`post-body${namespace}`, [currentPageData]);
        if (typeof settings.onPostBody === 'function') {
            settings.onPostBody(currentPageData);
        }
        hideLoading($table);
    }

    function createPagination($table, totalRows) {
        const settings = getSettings($table);

        // Berechne die Gesamtanzahl der Seiten
        const totalPages = Math.ceil(totalRows / settings.pageSize);
        const currentPage = settings.pageNumber || 1;

        const $paginationWrapper = $('<nav></nav>', {'data-role': 'tablePagination'});

        const $paginationList = $('<ul></ul>', {
            class: 'pagination justify-content-center m-0'
        }).appendTo($paginationWrapper);


        // "Previous"-Button
        const $prevItem = $('<li></li>', {
            'data-role': 'previous',
            class: `page-item ${currentPage === 1 ? 'disabled' : ''}`
        }).appendTo($paginationList);

        $('<a></a>', {

            class: 'page-link',
            href: '#',
            tabindex: currentPage === 1 ? '-1' : '',
            'aria-disabled': currentPage === 1 ? 'true' : 'false',
            html: '<i class="bi bi-chevron-left"></i>',
        }).appendTo($prevItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage > 1) {
                settings.pageNumber = currentPage - 1;
                setSettings($table, settings);
                handlePaginationChange($table);
            }
        });

        // Sichtbare Seiten (berechne die Seitennummern)
        const visiblePages = calculateVisiblePages(totalPages, currentPage);

        visiblePages.forEach(page => {
            if (page === "...") {
                $('<li></li>', {
                    class: 'page-item disabled'
                }).append(
                    $('<a></a>', {
                        class: 'page-link',
                        text: '...'
                    })
                ).appendTo($paginationList);
            } else {
                const $pageItem = $('<li></li>', {
                    class: `page-item ${page === currentPage ? 'active' : ''}`
                }).appendTo($paginationList);

                $('<a></a>', {
                    class: 'page-link',
                    href: '#',
                    text: page
                }).appendTo($pageItem).on('click', function (e) {
                    e.preventDefault();
                    if (page !== currentPage) {
                        settings.pageNumber = page;
                        setSettings($table, settings);
                        handlePaginationChange($table);
                    }
                });
            }
        });

        // "Next"-Button
        const $nextItem = $('<li></li>', {

            class: `page-item ${currentPage === totalPages ? 'disabled' : ''}`
        }).appendTo($paginationList);

        $('<a></a>', {
            'data-role': 'next',
            class: 'page-link',
            href: '#',
            tabindex: currentPage === totalPages ? '-1' : '',
            'aria-disabled': currentPage === totalPages ? 'true' : 'false',
            html: '<i class="bi bi-chevron-right"></i>',
        }).appendTo($nextItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                settings.pageNumber = currentPage + 1;
                setSettings($table, settings);
                handlePaginationChange($table);
            }
        });


        return $paginationWrapper;
    }

    function handlePaginationChange($table) {
        const settings = getSettings($table);
        const wrapper = getWrapper($table);
        if (settings.sidePagination === 'server') {
            refresh($table);
        } else if (settings.sidePagination === 'client') {
            renderTable($table);
        }
    }

    function calculateVisiblePages(totalPages, currentPage) {
        const visiblePages = []; // Array für sichtbare Seiten

        const maxVisible = 8; // Anzahl der maximal sichtbaren Seiten
        const half = Math.floor(maxVisible / 2);

        let startPage = Math.max(1, currentPage - half);
        const endPage = Math.min(totalPages, currentPage + half);

        // Füge die sichtbaren Seiten hinzu
        for (let i = startPage; i <= endPage; i++) {
            visiblePages.push(i);
        }

        // Füge "..." hinzu, falls nötig
        if (startPage > 1) {
            visiblePages.unshift("...");
        }
        if (endPage < totalPages) {
            visiblePages.push("...");
        }

        return visiblePages;
    }

    function calculateVisiblePages(totalPages, currentPage) {
        const visiblePages = [];

        // Fall 1: Aktuelle Seite ist in den ersten 4 Seiten
        if (currentPage <= 4) {
            for (let i = 1; i <= Math.min(5, totalPages); i++) {
                visiblePages.push(i);
            }
            if (totalPages > 5) {
                visiblePages.push("...");
                visiblePages.push(totalPages);
            }
        }
        // Fall 2: Aktuelle Seite ist in den letzten 4 Seiten
        else if (currentPage >= totalPages - 3) {
            visiblePages.push(1);
            if (totalPages > 5) {
                visiblePages.push("...");
            }
            for (let i = Math.max(totalPages - 4, 1); i <= totalPages; i++) {
                visiblePages.push(i);
            }
        }
        // Fall 3: Aktuelle Seite ist irgendwo in der Mitte
        else {
            visiblePages.push(1);
            visiblePages.push("...");
            visiblePages.push(currentPage - 1); // Linke Nachbarseite
            visiblePages.push(currentPage); // Aktuelle Seite
            visiblePages.push(currentPage + 1); // Rechte Nachbarseite
            visiblePages.push("...");
            visiblePages.push(totalPages);
        }

        return visiblePages;
    }


    function buildTableHeader($table, columns) {
        const settings = getSettings($table);
        if (settings.showHeader === false) {
            return;
        }
        let tableClasses = '';
        if (typeof settings.classes === 'object') {
            tableClasses = settings.classes.thead;
        }
        if (columns && columns.length) {
            const $thead = $table.find('thead').empty().addClass(tableClasses)
            const $tr = $('<tr></tr>').appendTo($thead);
            columns.forEach(column => {
                const $th = $('<th>', {
                    html: column.title ?? '',
                }).appendTo($tr);
            })
        }
    }

    function buildTableFooter($table, columns, data) {
        const settings = getSettings($table);
        if (settings.showFooter === false) {
            return;
        }
        let tableClasses = '';
        if (typeof settings.classes === 'object') {
            tableClasses = settings.classes.tfoot;
        }
        if (columns && columns.length) {
            const $tfoot = $table.find('tfoot').empty().addClass(tableClasses);
            const $tr = $('<tr></tr>').appendTo($tfoot);
            columns.forEach(column => {
                let value = '';
                if (typeof column.footerFormatter === 'function') {
                    value = column.footerFormatter(data);
                }
                const $td = $('<td>', {html: value}).appendTo($tr);
            })
        }
    }

    function buildTableBody($table, rows) {
        const settings = getSettings($table);
        const $tbody = $table.find('tbody').empty()
        if (rows && rows.length) {
            let tableClasses = '';
            if (typeof settings.classes === 'object') {
                tableClasses = settings.classes.tbody;
            }
            $tbody.addClass(tableClasses);
            let trIndex = 0;
            rows.forEach(row => {
                const $tr = $('<tr>', {
                    'data-index': trIndex,
                }).appendTo($tbody);
                if (typeof settings.rowStyle === 'function') {
                    settings.rowStyle(row, trIndex, $tr);
                }
                if (settings.columns && settings.columns.length) {
                    settings.columns.forEach(column => {
                        buildTableBodyTd(column, row, $tr);
                    })
                }
                trIndex++;
            })
        } else {
            const $tr = $('<tr></tr>').appendTo($tbody);
            const $td = $('<td>', {
                colspan: settings.columns.length,
                class: 'text-center',
                html: settings.formatNoMatches(),
            }).appendTo($tr);
        }
    }

    function buildTableBodyTd(column, row, $tr) {
        if (column.field) {
            let classList = [];
            if (column.class) {
                column.class.split(' ').forEach(className => {
                    classList.push(className);
                });
            }
            if (column.align) {
                classList.push('text-' + column.align);
            }
            if (column.valign) {
                classList.push('align-' + column.valign);
            }


            // Erstelle die `td`-Zelle mit Klassen und Wert
            const $td = $('<td>', {
                class: classList.join(' '),
            }).appendTo($tr);

            // Hole den Zellenwert (kann variabel sein)
            let value = row[column.field] ?? ' - ';
            if (column.formatter && typeof column.formatter === 'function') {
                const customValue = column.formatter(value, row, $tr.data('index'), $td);
                if (typeof customValue === 'string' && customValue.trim() !== '') {
                    value = customValue;
                }
            }

            $td.html(value);

            // Wenn `events` definiert ist, registriere diese für die Zelle
            if (column.events) {
                for (const [eventSelector, eventHandler] of Object.entries(column.events)) {
                    // Eventtypen und Selektor extrahieren
                    const splitEvent = eventSelector.split(' '); // Teile nach Leerzeichen
                    const selector = splitEvent.pop(); // Das letzte Element ist der Selektor (z.B. "span")
                    const eventTypes = splitEvent.join(' '); // Alles außer dem Selektor sind Eventtypen

                    // Überprüfe, ob ein spezifischer Selektor angegeben ist
                    if (selector) {
                        // Binde das Event mit Delegation, falls ein Selektor definiert ist
                        $td.on(eventTypes, selector, function (e) {
                            const index = $tr.data('index'); // Hole Zeilenindex
                            eventHandler(e, row[column.field] ?? null, row, index);
                        });
                    } else {
                        // Binde das Event direkt an die Zelle, wenn kein Selektor vorhanden ist
                        $td.on(eventTypes, function (e) {
                            const index = $tr.data('index'); // Hole Zeilenindex
                            eventHandler(e, row[column.field] ?? null, row, index);
                        });
                    }
                }
            }
        }
    }

    function getSettings($table) {
        return $table.data('bsTable').settings;
    }

    function getWrapper($table) {
        return $table.closest(`.${wrapperClass}`);
    }

    function getClosestWrapper($element) {
        return $element.closest(`.${wrapperClass}`);
    }

    function getPaginationContainer($table, top) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        const className = top ? 'top' : 'bottom'; // Bestimme, ob die Pagination oben oder unten sein soll

        // Finde den Pagination-Container und stelle sicher, dass er direkt zum aktuellen Wrapper gehört
        const $pagination = $wrapper.find(`.${wrapperPaginationClass}.${className}`).filter(function () {
            // Überprüfe, ob der Pagination-Container direkt dem aktuellen Wrapper zugeordnet ist
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Hole nur den ersten passenden Pagination-Container

        return $pagination.length > 0 ? $pagination : $(); // Fallback: Leeres jQuery-Objekt, wenn keiner gefunden
    }

    function getSearchInput($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper

        // Finde den einzigen Such-Input im Wrapper, aber ignoriere Inputs aus untergeordneten Wrappers
        const $searchInput = $wrapper.find('.' + inputSearchClass).filter(function () {
            // Stelle sicher, dass der Input direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur den ersten gefilterten Input holen (falls mehr als einer gefunden wird)

        return $searchInput.length > 0 ? $searchInput : $(); // Fallback: leeres jQuery-Objekt, falls nichts gefunden
    }

    function getOverlay($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper

        // Finde das Overlay im aktuellen Wrapper, ignoriere Overlays in verschachtelten Wrappers
        const $overlay = $wrapper.find('.' + wrapperOverlayClass).filter(function () {
            // Überprüfe, ob dieses Overlay direkt im aktuellen Wrapper liegt
            return getClosestWrapper($(this))[0] === $wrapper[0];
        }).first(); // Nur das erste Overlay holen (falls mehrere gefunden werden)

        return $overlay.length > 0 ? $overlay : $(); // Fallback: leeres jQuery-Objekt, falls kein Overlay gefunden wurde
    }

    function setSettings($table, settings) {
        const data = $table.data('bsTable');
        if (data) {
            data.settings = settings;
        }
        $table.data('bsTable', data);
    }


    /**
     * Checks if the given value is empty. A value is considered empty if it is:
     * - null
     * - undefined
     * - an empty array
     * - a string containing only whitespace characters
     *
     * @param {*} value - The value to be checked for emptiness.
     * @return {boolean} - Returns `true` if the value is empty, otherwise `false`.
     */
    function isValueEmpty(value) {
        if (value === null || value === undefined) {
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

    function events($table) {
        const wrapper = getWrapper($table);
        let searchTimeout;

        wrapper
            .on('click', `button[data-role="refresh"]`, function (e) {
                e.preventDefault();
                refresh($table)
            })
            .on('input', `.${inputSearchClass}`, function (e) {
                const searchField = $(e.currentTarget);

                // Prüfen, ob das Input-Feld innerhalb des aktuellen Wrappers liegt
                if (getClosestWrapper(searchField)[0] === wrapper[0]) {
                    // Existierenden Timeout abbrechen, um mehrfaches Auslösen zu vermeiden
                    clearTimeout(searchTimeout);

                    searchTimeout = setTimeout(function () {
                        const settings = getSettings($table);

                        // Setze die aktuelle Seite auf die erste Seite (bei neuer Suche)
                        settings.pageNumber = 1;
                        setSettings($table, settings);

                        // Rufe neue Daten basierend auf der Suche ab und aktualisiere die Tabelle
                        refresh($table);
                    }, 400);
                }
            })
            .on('click', `.${wrapperPaginationClass} .page-link`, function (e) {
                e.preventDefault();

                const $pageLink = $(e.currentTarget); // Das angeklickte Pagination-Element
                const $paginationWrapper = getClosestWrapper($pageLink); // Aktuellen Wrapper des Pagination-Buttons ermitteln

                // Sicherstellen, dass der Klick nur innerhalb des aktuellen Wrappers verarbeitet wird
                if ($paginationWrapper[0] !== wrapper[0]) {
                    return; // Abbrechen, wenn Pagination-Button zu einem verschachtelten Wrapper gehört
                }

                const settings = getSettings($table);

                // Ignoriere Klicks auf deaktivierte oder aktive Buttons
                if ($pageLink.parent().hasClass('disabled') || $pageLink.parent().hasClass('active')) {
                    return;
                }

                // Verarbeite die verschiedenen Aktionen basierend auf dem Pagination-Button
                const action = $pageLink.attr('data-role') || $pageLink.html().toLowerCase().trim();

                // Greife auf die gespeicherten Daten zu
                const response = $table.data('response') || {rows: [], total: 0};
                const totalPages = Math.ceil(response.total / settings.pageSize); // Berechnung der Gesamtseiten

                // Prüfe die Aktion und berechne die neue Seitenzahl
                if (action.includes('previous') || action.includes('left')) {
                    settings.pageNumber = Math.max(1, settings.pageNumber - 1); // Eine Seite zurück
                } else if (action.includes('next') || action.includes('right')) {
                    settings.pageNumber = Math.min(totalPages, settings.pageNumber + 1); // Eine Seite vor
                } else {
                    const pageNum = parseInt($pageLink.text().trim(), 10);
                    if (!isNaN(pageNum)) {
                        settings.pageNumber = pageNum; // Spezifische Seitennummer
                    }
                }

                // Speichere die aktualisierten Einstellungen
                setSettings($table, settings);

                // Aktualisiere die Tabelle basierend auf der neuen Seitenzahl
                handlePaginationChange($table);
            });
    }
}(jQuery))