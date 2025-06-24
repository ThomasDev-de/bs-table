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
            pageList: [5, 10, 25, 50, 100, 200, 'All'],
            sortName: null,
            sortOrder: 'asc',
            multipleSort: [],
            showRefresh: true,
            showHeader: true,
            showFooter: true,
            url: null,
            data: null,
            columns: [],
            icons: {
                sortAsc: 'bi bi-caret-down-fill text-primary',
                sortDesc: 'bi bi-caret-up-fill text-primary',
                sortNone: 'bi bi-caret-down',
                refresh: 'bi bi-arrow-clockwise',
                search: 'bi bi-search',
                paginationNext: 'bi bi-chevron-right',
                paginationprev: 'bi bi-chevron-left',
            },
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
            },
            debug: false
        }
    };

    const wrapperClass = 'bs-table-wrapper';
    const wrapperTableClass = 'bs-table-inner-wrapper';
    const wrapperOverlayClass = 'bs-table-wrapper-overlay';
    const wrapperSearchClass = 'bs-table-wrapper-search';
    const wrapperPaginationClass = 'bs-table-pagination-container';
    const wrapperPaginationDetailsClass = 'bs-table-pagination-details';
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
            const settings = $.extend(true, {}, $.bsTable.defaults, $table.data() || {}, options);
            if (!settings.columns || !Array.isArray(settings.columns)) {
                settings.columns = [];
            }
            const sortArray = [];
            settings.columns.forEach(column => {
                if (column.field && column.sortable === true) {
                    const selected = column.field === settings.sortName;
                    settings.multipleSort.push({
                        sort: selected ? 1 : null,
                        selected: selected,
                        field: column.field,
                        order: selected ? settings.sortOrder ?? 'asc' : ''
                    })
                }
            })
            const bsTable = {
                settings: settings,
            };
            $table.data('bsTable', bsTable);
            buildTable($table);
            events($table);
        }

        if (typeof optionsOrMethod === 'string') {
            switch (optionsOrMethod) {
                case 'showLoading': {
                    showLoading($table);
                }
                    break;
                case 'hideLoading': {
                    hideLoading($table);
                }
                    break;
                case 'refresh': {
                    const arg = args.length ? args[0] : null;
                    refresh($table, arg);
                }
                    break;
                case 'refreshOptions': {
                    const arg = args.length ? args[0] : null;
                    if (arg && typeof arg === 'object') {
                        const setup = getSettings($table);
                        $.extend(true, setup, arg);
                        setSettings($table, setup);
                        refresh($table);
                    }
                }
                    break;
                case 'getSettings': {
                    return getSettings($table);
                } break;
                case 'setCaption': {
                    const arg = args.length ? args[0] : null;
                    if (arg !== null && typeof arg === 'object') {
                        let caption = $table.find('caption:first');
                        if (! caption.length) {
                            caption = $('<caption>', {
                                html: arg.text,
                            }).prependTo($table);
                        } else {
                            caption.html(arg.text);
                        }
                        if (arg.hasOwnProperty('onTop') && arg.onTop === true) {
                            caption.addClass('caption-top');
                        } else {
                            caption.removeClass('caption-top');
                        }
                        if (arg.hasOwnProperty('classes') && typeof arg.classes === 'string') {
                            // Entferne alle vorhandenen Klassen aus dem Element
                            caption.attr('class', '');

                            // Füge die neue Klasse hinzu
                            caption.addClass(arg.classes);
                        }
                    }
                }break;
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

        // Opt-Parameter verarbeiten
        if (options && typeof options === 'object') {
            if (options.silent) silent = options.silent;
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
            settings.pageNumber = pageNumber;
            settings.pageSize = pageSize;
            setSettings($table, settings);
        }

        if (!silent) {
            showLoading($table);
        }

        fetchData($table)
            .then(() => {
                renderTable($table, silent); // Tabelle aktualisieren
            })
            .catch(error => {
                console.error("Fehler beim Abrufen der Daten:", error);
            })
            .finally(() => {
                hideLoading($table);
            })
    }

    function fetchData($table) {
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

            // Handle limit and offset
            // Pagination prüfen und anpassen
            const pageNumber = settings.pageNumber > 0 ? settings.pageNumber : 1;
            const pageSize = settings.pageSize ?? 10; // Setze Standardwert, falls pageSize nicht definiert ist

            if (pageSize === 0) {
                if (settings.debug) {
                    console.log("Besonderer Fall: pageSize = 0 (Alle Datensätze anzeigen).");
                }
                params.limit = null; // Keine Begrenzung
                params.offset = 0;   // Keine Verschiebung
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
            const searchInput = getSearchInput($table);
            if (settings.search && searchInput.length) {
                const searchValue = searchInput.val()?.trim() || null;
                params.search = searchValue && !isValueEmpty(searchValue) ? searchValue : null;
                if (settings.debug) {
                    console.log("Suchkriterien verarbeitet:", params.search); // DEBUG
                }
            }

            // handle custom params
            // Zusätzliche Query-Parameter vom User
            if (typeof settings.queryParams === "function") {
                params = settings.queryParams(params);
                if (settings.debug) {
                    console.log("Zusätzliche Query-Parameter:", params); // DEBUG
                }
            }

            // Verarbeitung von lokalen Daten
            if (Array.isArray(settings.data)) {

                if (settings.debug) {
                    console.log("Lokale Daten erkannt. Verarbeite lokale Daten...");
                }

                let filteredData = [...settings.data];

                if (params.sort && params.order) {
                    if (settings.debug) {
                        console.log(`Sortiere lokale Daten nach "${params.sort}" in Reihenfolge "${params.order}".`); // DEBUG
                    }

                    sortArrayByField(filteredData, params.sort, params.order);

                    if (settings.debug) {
                        console.log("Daten nach Sortierung:", filteredData); // DEBUG
                    }
                }

                // Suche anwenden, falls relevant
                if (params.search) {
                    if (settings.debug) {
                        console.log("Suchfilter wird angewendet: ", params.search); // DEBUG
                    }
                    filteredData = filteredData.filter(row =>
                        Object.values(row).some(value =>
                            value && value.toString().toLowerCase().includes(params.search.toLowerCase())
                        )
                    );
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
                    $table.data('response', {rows: filteredData, total: totalRows});
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
                    $table.data('response', {rows: [], total: totalRows});
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

                $table.data('response', {rows: slicedData, total: totalRows});
                if (settings.debug) {
                    console.groupEnd();
                }
                resolve();
                return;
            }

            // Verarbeitung von serverseitigen Daten (falls konfiguriert)
            // Verarbeitung von serverseitigen Daten (falls konfiguriert)
            if (settings.url) {
                if (settings.debug) {
                    console.log("Starte Datenabruf vom Server:", settings.url, "mit Parametern:", params); // DEBUG
                }

                if (typeof settings.url === "function") {
                    // `url` ist eine Funktion: Call und warten auf Promise
                    if (settings.debug) {
                        console.log("settings.url ist eine Funktion. Rufe Funktion mit Parametern auf."); // DEBUG
                    }

                    settings.url(params)
                        .then(response => {
                            // Verarbeite die Antwort wie bei der normalen Ajax-Abfrage
                            const processedResponse = Array.isArray(response)
                                ? {rows: response, total: response.length}
                                : {rows: response.rows || [], total: response.total || 0};

                            if (settings.debug) {
                                console.log("API-Antwort von Funktion erhalten:", processedResponse); // DEBUG
                            }

                            $table.data('response', processedResponse);

                            if (settings.debug) {
                                console.groupEnd();
                            }

                            resolve();
                        })
                        .catch(error => {
                            // Fehlerhandling
                            if (settings.debug) {
                                console.error("Fehler bei der Verarbeitung der Funktion:", error); // DEBUG
                                console.groupEnd();
                            }
                            reject(new Error(`Fehler bei der API-Abfrage (Funktion): ${error.message || error}`));
                        });
                } else {
                    // `url` ist ein String: Standard-Ajax-Logik
                    if (settings.debug) {
                        console.log("settings.url ist ein String. Verwende $.ajax für Abruf."); // DEBUG
                    }

                    $.ajax({
                        url: settings.url,
                        method: "GET",
                        data: params,
                        dataType: "json"
                    })
                        .done(response => {
                            const processedResponse = Array.isArray(response)
                                ? {rows: response, total: response.length}
                                : {rows: response.rows || [], total: response.total || 0};

                            if (settings.debug) {
                                console.log("API-Antwort von String-URL erhalten:", processedResponse); // DEBUG
                            }

                            $table.data('response', processedResponse);

                            if (settings.debug) {
                                console.groupEnd();
                            }

                            resolve();
                        })
                        .fail((xhr, status, error) => {
                            if (settings.debug) {
                                console.error("Fehler bei der API-Abfrage (String-URL):", status, error); // DEBUG
                                console.groupEnd();
                            }
                            reject(new Error(`Fehler bei der API-Abfrage (String-URL): ${status}, ${error}`));
                        });
                }
            }
        });
    }

    /**
     * Sortiert ein Array basierend auf einem Feld und einer Sortierreihenfolge.
     *
     * @param {Array} data - Das Array, das sortiert werden soll.
     * @param {string} field - Der Name des Feldes, nach dem sortiert werden soll.
     * @param {string} order - Die Sortierreihenfolge: "ASC" (aufsteigend) oder "DESC" (absteigend).
     * @return {Array} - Das sortierte Array.
     */
    function sortArrayByField(data, field, order = "ASC") {
        // Sicherstellen, dass die Reihenfolge korrekt ist
        const direction = order.toUpperCase() === "DESC" ? -1 : 1;

        return data.sort((a, b) => {
            // NULL-Werte nach hinten sortieren
            if (a[field] == null && b[field] == null) return 0; // Beide NULL
            if (a[field] == null) return 1 * direction; // `a` ist NULL → `b` vorher
            if (b[field] == null) return -1 * direction; // `b` ist NULL → `a` vorher

            // Zahlen- oder Stringvergleich
            const aValue = typeof a[field] === "number" ? a[field] : a[field].toString().toLowerCase();
            const bValue = typeof b[field] === "number" ? b[field] : b[field].toString().toLowerCase();

            if (aValue > bValue) return 1 * direction;
            if (aValue < bValue) return -1 * direction;

            // Alles gleich: Reihenfolge beibehalten
            return 0;
        });
    }

    function buildTable($table) {
        $table.empty(); // Tabelle leeren
        const settings = getSettings($table);
        // Erstelle den Haupt-Wrapper
        const $wrapper = $('<div>', {
            class: wrapperClass + ' position-relative',
            id: generateRandomWrapperId(),
        }).insertAfter($table);

        // Setze CSS-Klassen auf die Tabelle
        const tableClasses = [];
        if (typeof settings.classes === 'string') {
            settings.classes.split(' ').forEach(className => {
                const name = className.trim();
                if (!isValueEmpty(name)) {
                    tableClasses.push(className);
                }
            });
        } else if (typeof settings.classes === 'object' && settings.classes.hasOwnProperty('table')) {
            settings.classes.table.split(' ').forEach(className => {
                const name = className.trim();
                if (!isValueEmpty(name)) {
                    tableClasses.push(className);
                }
            });
        }
        $table.addClass(tableClasses.join(' '));
        $table.appendTo($wrapper);

        // **Neuer Table-Top-Container inkl. Pagination und Suche**
        const $tableTopContainer = buildTableTop($table).prependTo($wrapper);
        const $tableBottomContainer = buildTableBottom($table).appendTo($wrapper);

        $('<thead></thead>').appendTo($table);
        $('<tbody></tbody>').appendTo($table);
        $('<tfoot></tfoot>').appendTo($table);

        refresh($table)
    }

    function buildTableBottom($table) {
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

        const template = `
            <div class="d-flex flex-column ${gapClass}" data-role="tableBottomContainer">
                <div class="d-flex justify-content-between ${flexClass}">
                    <div class="${wrapperPaginationDetailsClass}"></div>
                    <div class="${wrapperPaginationClass} bottom"></div>
                </div>
            </div>`;
        return $(template);
    }

    function buildTableTop($table) {
        const $wrapper = getWrapper($table);
        const settings = getSettings($table);

        let flexClass = 'flex-row';
        if (!['right', 'end'].includes(settings.paginationHAlign)) {
            flexClass += ' flex-row-reverse';
        }

        let gapClass = '';
        if (
            (settings.pagination === true && ['top', 'both'].includes(settings.paginationVAlign)) ||
            settings.search === true ||
            settings.toolbar ||
            settings.showRefresh
        ) {
            gapClass = 'gap-2 py-2';
        }

        const template = `
            <div class="d-flex flex-column ${gapClass}" data-role="tableTopContainer">
                <div class="d-flex justify-content-end align-items-end">
                    <div class="d-flex bs-table-toolbar me-auto">
                    </div>
                    <div class="d-flex ${wrapperSearchClass}">
                    </div>
                    <div class="btn-group bs-table-buttons">
                    </div>
                </div>
                <div class="d-flex justify-content-between ${flexClass}">
                    <div class="${wrapperPaginationDetailsClass}"></div>
                    <div class="${wrapperPaginationClass} top"></div>
                </div>
            </div>`;

        // Top Container bestehend aus 1-n Zeilen
        const $tableTopContainer = $(template);
        const $toolbarContainer = $tableTopContainer.find('.bs-table-toolbar');
        const $searchWrapper = $tableTopContainer.find('.' + wrapperSearchClass);
        const $btnContainer = $tableTopContainer.find('.bs-table-buttons');


        // Falls ein Toolbar-Element definiert ist, füge dieses in die erste Zeile und
        // setze margin end auf auto, damit sie links zentriert ist
        if (settings.toolbar && $(settings.toolbar).length > 0) {
            $(settings.toolbar).prependTo($toolbarContainer);
        }

        // Such-Wrapper erstellen (links)
// Falls die Suche aktiviert ist, füge ein Input-Feld und Logik hinzu
        if (settings.search === true) {
            const $searchInputGroup = $(`
    <div class="input-group">
        <span class="input-group-text"><i class="${settings.icons.search}"></i></span>
        <input type="search" class="form-control ${inputSearchClass}" placeholder="...">
    </div>
`);
            $searchInputGroup.appendTo($searchWrapper);
        }

        if (settings.showRefresh) {
            const $refreshButton = $(`<button>`, {
                class: 'btn btn-secondary',
                html: `<i class="${settings.icons.refresh}"></i>`,
                title: 'Refresh',
                'data-role': 'refresh',
            }).appendTo($btnContainer);
        }


        return $tableTopContainer;
    }

    function hideLoading($table) {
        const $overlay = getOverlay($table);
        if (!$overlay.length) return; // Abbruch, falls kein Overlay vorhanden ist

        // Vorherige Animation stoppen und sanftes Ausblenden starten
        $overlay.stop().animate({opacity: 0}, 100, function () {
            // Nach dem Ausblenden das Overlay vollständig entfernen
            $(this).remove();
        });
    }

    function showLoading($table) {
        const settings = getSettings($table);

        const wrapper = getWrapper($table);
        // Vorhandenes Overlay entfernen, falls vorhanden
        hideLoading($table);

        // Overlay generieren
        const $overlay = $('<div>', {
            class: wrapperOverlayClass + ' position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-body',
            css: {
                zIndex: 4,
                opacity: 0 // Das Overlay startet unsichtbar
            }
        }).appendTo(wrapper);

        // Placeholder-Struktur erstellen (Inhalt des Overlays)
        const $content = $(`
<div class="spinner-border" style="width: 3rem; height: 3rem;" role="status">
  <span class="visually-hidden">Loading...</span>
</div>`).appendTo($overlay);

        // Sanftes Einblenden mit animate
        $overlay.animate({opacity: 0.75}, 100); // Dauer: 300ms
    }

    function renderTable($table) {
        const settings = getSettings($table);
        if (settings.debug) {
            console.groupCollapsed("Render Table");
        }
        const wrapper = getWrapper($table);
        const response = $table.data('response') || {rows: [], total: 0};
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


        if (settings.columns && settings.columns.length) {
            buildTableHeader($table, settings.columns);
            buildTableBody($table, currentPageData);
            buildTableFooter($table, settings.columns, response.rows);
        }

        const $topPaginationContainer = getPaginationContainer($table, true).empty();
        const $bottomPaginationContainer = getPaginationContainer($table, false).empty();

        const $tableTopContainer = getTableTopContainer($table);
        const $btnContainer = $tableTopContainer.find('.bs-table-buttons:first');
        if (isValueEmpty(settings.pageList)) {
            $btnContainer.find('[data-role="tablePaginationPageSize"]:first').remove();
        } else {
            const $pageListDropdown = buildPagelistDropdown($table, totalRows);
            if ($btnContainer.find('[data-role="tablePaginationPageSize"]:first').length > 0) {
                $btnContainer.find('[data-role="tablePaginationPageSize"]:first').replaceWith($pageListDropdown);
            } else {
                $pageListDropdown.prependTo($btnContainer);
            }
        }

        if ($btnContainer.find('.btn').length && settings.search === true) {
            // haben wir buttons und ein suchfeld, packe margin hinzu
            $btnContainer.addClass('ms-2');
        } else {
            // andernfalls entferne den margin
            $btnContainer.removeClass('ms-2');
        }

        if (settings.pagination && pageSize !== 0) {
            const $wrapper = getWrapper($table);

            const $paginationHtml = createPagination($table, totalRows);


            if (settings.paginationVAlign === 'top' || settings.paginationVAlign === 'both') {
                // $topPaginationContainer.append($paginationDetailHtml);
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
    }

    function createPaginationDetails($table, totalRows) {
        const settings = getSettings($table);

        // Berechnung der Anzeige-Daten (Start- und Endzeilen)
        const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
        const currentPage = settings.pageNumber || 1;
        const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endRow = Math.min(totalRows, currentPage * pageSize);

        // Haupt-Wrapper (d-flex für Flexbox)
        const $paginationDetailWrapper = $('<div>', {
            'class': 'd-flex align-items-center',
            'data-role': 'tablePaginationPageSize'
        });

        // Textanzeige: "Showing x to y of total rows"
        const $paginationText = $('<span>', {
            'class': 'mx-2'
        }).html(`<div class="badge text-bg-secondary">${startRow} - ${endRow} / ${totalRows}</div>`);

        // Dropdown für die Zeilenanzahl pro Seite
        const $dropdownToggle = $('<button>', {
            'class': 'btn btn-secondary dropdown-toggle me-1',
            'type': 'button',
            'id': 'dropdownPaginationPageSize',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': 'false'
        }).html((pageSize === totalRows ? 'All' : pageSize) + ' <i class="bi bi-list-columns-reverse"></i>');

        const $dropdownMenu = $('<ul>', {
            'class': 'dropdown-menu',
            'aria-labelledby': 'dropdownPaginationPageSize'
        });

        // Dropdown-Optionen hinzufügen
        // settings.pageList
        //     .filter(page => page === 'All' || page < totalRows)
        //     .forEach(page => {
        //         const value = page === 'All' ? 0 : page;
        //         const isAll = value === 0;
        //         const isActive = (isAll && pageSize === 0) || page === pageSize;
        //         const text = isAll ? 'All' : page;
        //         const $dropdownItem = $('<li>').append(
        //             $('<a>', {
        //                 class: `dropdown-item ${isActive ? 'active' : ''}`,
        //                 href: '#',
        //                 'data-page': value
        //             }).text(text)
        //         );
        //         $dropdownMenu.append($dropdownItem);
        //     });

        // Text für "rows per page"
        const $rowsPerPageText = $('<span>').text('');

        // Baue die Reihenfolge zusammen: Dropdown vor "rows per page"
        $paginationDetailWrapper.append($dropdownToggle, $dropdownMenu, $paginationText);

        return $paginationDetailWrapper;
    }

    function buildPagelistDropdown($table, totalRows) {
        const settings = getSettings($table);
        // Berechnung der Anzeige-Daten (Start- und Endzeilen)
        const pageSize = settings.pageSize || totalRows; // "All" wird als alle Zeilen interpretiert
        const currentPage = settings.pageNumber || 1;
        const startRow = totalRows === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endRow = Math.min(totalRows, currentPage * pageSize);

        // Haupt-Wrapper (d-flex für Flexbox)
        const $dropdownWrapper = $('<div>', {
            'class': 'dropdown btn-group',
            'data-role': 'tablePaginationPageSize'
        });
        // Dropdown für die Zeilenanzahl pro Seite
        const $dropdownToggle = $('<button>', {
            'class': 'btn btn-secondary dropdown-toggle',
            'type': 'button',
            'id': 'dropdownPaginationPageSize',
            'data-bs-toggle': 'dropdown',
            'aria-expanded': 'false'
        }).html((pageSize === totalRows ? 'All' : pageSize) + ' <i class="bi bi-list-columns-reverse"></i>');

        const $dropdownMenu = $('<ul>', {
            'class': 'dropdown-menu dropdown-menu-end',
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
                const $dropdownItem = $('<li>').append(
                    $('<a>', {
                        class: `dropdown-item ${isActive ? 'active' : ''}`,
                        href: '#',
                        'data-page': value
                    }).text(text)
                );
                $dropdownMenu.append($dropdownItem);
            });

        $dropdownWrapper.append($dropdownToggle, $dropdownMenu);
        return $dropdownWrapper;
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
            html: `<i class="${settings.icons.paginationprev}"></i>`,
        }).appendTo($prevItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage > 1) {
                settings.pageNumber = currentPage - 1;
                setSettings($table, settings);
                refresh($table);
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
                        refresh($table);
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
            html: `<i class="${settings.icons.paginationNext}"></i>`,
        }).appendTo($nextItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                settings.pageNumber = currentPage + 1;
                setSettings($table, settings);
                refresh($table);
            }
        });


        return $paginationWrapper;
    }

    function calculateVisiblePages(totalPages, currentPage) {
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
    }

    function buildTableHeader($table, columns) {
        const settings = getSettings($table);
        const headerClasses = [];
        if (settings.showHeader === false) {
            headerClasses.push('d-none')
        }
        if (typeof settings.classes === 'object' && typeof settings.classes.thead === 'object') {
            settings.classes.thead.split(' ').forEach(className => {
                const name = className.trim();
                if (!isValueEmpty(name)) {
                    headerClasses.push(className);
                }
            });
        }
        if (columns && columns.length) {
            const $thead = $table.find('thead').empty().addClass(headerClasses.join(' '))
            const $tr = $('<tr></tr>').appendTo($thead);
            columns.forEach(column => {
                if (column.visible === false) {
                    return;
                }
                const html = [
                    `<div class="d-flex align-items-center justify-content-between">`,
                    `<span>${column.title ?? ''}</span>`,
                ];
                if (column.sortable === true) {

                    html.push(`<span><i class="bs-table-icon"></i></span>`);
                }
                html.push(`</div>`);
                const order = column.field === settings.sortName ? settings.sortOrder ?? '' : '';
                const $th = $('<th>', {
                    'data-sortable': column.sortable === true ? 'true' : 'false',
                    'data-field': column.field,
                    'data-order': order,
                    html: html.join('')
                }).appendTo($tr);
                if (column.sortable === true) {
                    $th.css('cursor', 'pointer');
                }

                const icon = getIconBySortOrder($table, order);
                $th.find('.bs-table-icon').addClass(icon);

                if (column.width) {
                    $th.css('width', column.width);
                }
            })
        }
    }

    function setNextSortStatus($table, field) {
        const settings = getSettings($table);
        const el = settings.multipleSort.find(sort => sort.field === field);

        if (el) {
            if (el.order === 'asc') {
                el.order = 'desc';
                el.icon = settings.icons.sortDesc;
                el.selected = true;
                settings.sortOrder = 'desc';
                settings.sortName = field;
            } else if (el.order === 'desc') {
                el.order = '';
                el.icon = settings.icons.sortNone;
                el.selected = false;
                settings.sortOrder = null;
                settings.sortName = null;
            } else {
                el.order = 'asc';
                el.icon = settings.icons.sortAsc;
                el.selected = true;
                settings.sortOrder = 'asc';
                settings.sortName = field;
            }

            // Setze ein Hilfsattribut, um die zuletzt angeklickte Spalte zu markieren
            if (el.selected) {
                el.lastSelected = Date.now(); // Aktueller Zeitstempel
            } else {
                el.lastSelected = null; // Zurücksetzen, wenn nicht mehr ausgewählt
            }

            // Aktualisiere die Sortierlogik
            updateSortOrder(settings.multipleSort);

            // Hilfsattribute `lastSelected` entfernen
            settings.multipleSort.forEach(sort => delete sort.lastSelected);

            // Speichere die geänderten Einstellungen
            setSettings($table, settings);
        }
    }

    function updateSortOrder(multipleSort) {
        let sortIndex = 1;

        // Sortiere das Array nach den `selected`- und `lastSelected`-Attributen
        multipleSort.sort((a, b) => {
            // Priorität 1: `selected` zuerst (true vor false)
            if (a.selected !== b.selected) {
                return b.selected - a.selected;
            }

            // Priorität 2: Innerhalb der `selected`-Gruppe, nach `lastSelected` (höherer Timestamp = weiter hinten)
            if (a.selected && b.selected) {
                return (a.lastSelected || 0) - (b.lastSelected || 0);
            }

            return 0; // Keine Änderung für nicht selektierte Spalten
        });

        // Neue Sort-Werte vergeben
        multipleSort.forEach(sort => {
            if (sort.selected) {
                sort.sort = sortIndex++;
            } else {
                sort.sort = null; // `sort` zurücksetzen, wenn nicht ausgewählt
            }
        });
    }

    function getIconBySortOrder($table, sortOrder) {
        const settings = getSettings($table);
        if (sortOrder === 'asc') {
            return settings.icons.sortAsc;
        }
        if (sortOrder === 'desc') {
            return settings.icons.sortDesc;
        }
        return settings.icons.sortNone;
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
                if (column.visible === false) {
                    return;
                }
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
                        if (column.visible === false) {
                            return;
                        }
                        buildTableBodyTd(column, row, $tr);
                    })
                }
                trIndex++;
            })
        } else {
            const $tr = $('<tr></tr>').appendTo($tbody);
            const $td = $('<td>', {
                colspan: getCountColumns($table),
                class: 'text-center',
                html: settings.formatNoMatches(),
            }).appendTo($tr);
        }
    }

    function getCountColumns($table, onlyVisible = true) {
        const settings = getSettings($table);

        if (!settings.columns || !settings.columns.length) {
            return 0; // Keine Spalten
        }

        // Filtert sichtbare Spalten, wenn onlyVisible true ist, sonst zählt alle.
        return settings.columns.filter(column => !onlyVisible || column.visible !== false).length;
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

    function getTableBottomContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        return $wrapper.find(`[data-role="tableBottomContainer"]`).first();
    }

    function getTableTopContainer($table) {
        const $wrapper = getWrapper($table);
        return $wrapper.find(`[data-role="tableTopContainer"]`).first();
    }

    function getPaginationContainer($table, top) {
        if (top) {
            return getTableTopContainer($table).find('.' + wrapperPaginationClass);
        } else {
            return getTableBottomContainer($table).find('.' + wrapperPaginationClass);
        }
    }

    function getPaginationDetailsContainer($table) {
        const $wrapper = getWrapper($table); // Hole den aktuellen Plugin-Wrapper
        // Finde den Pagination-Container und stelle sicher, dass er direkt zum aktuellen Wrapper gehört
        const $pagination = $wrapper.find(`.${wrapperPaginationDetailsClass}`).filter(function () {
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

    function generateRandomWrapperId() {
        const prefix = "bs_table_wrapper_";

        const guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (char) {
            const random = Math.random() * 16 | 0;
            const value = char === 'x' ? random : (random & 0x3 | 0x8);
            return value.toString(16);
        });

        // Falls Unterstriche statt Minuse gewünscht sind
        const modifiedGuid = guid.replace(/-/g, '_');

        return prefix + modifiedGuid;
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

    function handleTheadThClick($table, $current) {
        const settings = getSettings($table);
        const allSortableHeaders = $table.find('thead:first th[data-sortable="true"]')
        const filteredHeaders = allSortableHeaders.not($current);

        filteredHeaders.each(function (i, el) {
            const $th = $(el);
            $th.attr('data-order', '');
            const $icon = $th.find('i.bs-table-icon');
            $icon.removeClass(settings.icons.sortNone);
            $icon.removeClass(settings.icons.sortAsc);
            $icon.removeClass(settings.icons.sortDesc);
            $icon.addClass(settings.icons.sortNone);
        });

        if ($current.length > 0) {
            let order = $current.attr('data-order');
            if (order === 'asc') {
                order = 'desc';
            } else if (order === 'desc') {
                order = '';
            } else {
                order = 'asc';
            }
            const $iconCurrent = $current.find('i.bs-table-icon');
            const field = $current.attr('data-field');
            $iconCurrent.removeClass(settings.icons.sortNone);
            $iconCurrent.removeClass(settings.icons.sortAsc);
            $iconCurrent.removeClass(settings.icons.sortDesc);
            $current.attr('data-order', order);
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

        setSettings($table, settings);
    }

    function events($table) {
        const wrapper = getWrapper($table);
        let searchTimeout;

        wrapper
            .on('click', `[data-sortable="true"]`, function (e) {
                const $th = $(e.currentTarget);
                if (getClosestWrapper($th)[0] === wrapper[0]) {
                    const table = $th.closest('table');
                    handleTheadThClick(table, $th);
                    refresh($table);
                }
            })
            .on('click', `[data-role="tablePaginationPageSize"] .dropdown-item`, function (e) {
                e.preventDefault();
                const $a = $(e.currentTarget);
                if (getClosestWrapper($a)[0] === wrapper[0]) {
                    const settings = getSettings($table);
                    const response = $table.data('response')
                    // Aktualisiere die Seitengröße
                    settings.pageSize = parseInt($a.data('page'));
                    const totalRows = response.total; // Gesamtdaten
                    const maxPageNumber = Math.ceil(totalRows / settings.pageSize); // Maximale Seitenzahl

                    // Fallback, falls die aktuelle Seite ungültig wird
                    if (settings.pageNumber > maxPageNumber) {
                        console.warn(`Seite ${settings.pageNumber} ist ungültig. Fallback auf letzte Seite (${maxPageNumber}).`);
                        settings.pageNumber = maxPageNumber; // Fallback auf die letzte Seite
                    }

                    setSettings($table, settings);
                    refresh($table); // Tabelle neu laden
                }
            })
            .on('click', `button[data-role="refresh"]`, function (e) {
                e.preventDefault();
                const btn = $(e.currentTarget);
                if (getClosestWrapper(btn)[0] === wrapper[0]) {
                    refresh($table)
                }
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
                refresh($table);
            });
    }
}(jQuery))
