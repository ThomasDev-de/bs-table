(function ($) {
    "use strict";

    $.bsTable = {
        defaults: {
            classes: 'table',
            toolbar: null,
            pagination: true,
            sidePagination: 'server',
            pageNumber: 1,
            pageSize: 10,
            showHeader: true,
            showFooter: true,
            url: null,
            data: null,
            columns: [],
            queryParams: function (params) {
                return params;
            },
            responseHandler: function (res) {
                return res;
            },
            onLoadSuccess: function () {
            },
            onLoadError: function () {
            },
            onPageChange: function () {
            },
            onPostBody: function () {
            },
        }
    };

    const wrapperClass = 'bs-table-wrapper';
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
        }

        return $table;
    };

    function fetchDataWithPromise($table) {
        return new Promise((resolve, reject) => {
            const settings = getSettings($table);

            if (!settings.url) {
                reject(new Error("Es wurde keine URL konfiguriert."));
                return;
            }

            let params = {};
            if (settings.pagination) {
                params.limit = settings.pageSize; // Anzahl der Elemente pro Seite
                params.offset = (settings.pageNumber - 1) * settings.pageSize; // Startindex basierend auf der aktuellen Seite
            }

            if (typeof settings.queryParams === "function") {
                params = settings.queryParams(params);
            }

            $.ajax({
                url: settings.url,
                method: "GET",
                data: params,
                dataType: "json",
            })
                .done((response) => {
                    // Verarbeite Serverantwort
                    if (typeof settings.responseHandler === "function") {
                        response = settings.responseHandler(response);
                    }

                    if (typeof settings.onLoadSuccess === "function") {
                        settings.onLoadSuccess(response);
                    }

                    resolve(response);
                })
                .fail((xhr, textStatus, errorThrown) => {
                    console.error("Fehler beim Abrufen der Daten:", textStatus, errorThrown);

                    if (typeof settings.onLoadError === "function") {
                        settings.onLoadError(xhr, textStatus, errorThrown);
                    }

                    reject(new Error(`Fehler: ${textStatus}, ${errorThrown}`));
                });
        });
    }

    function buildTable($table) {
        $table.empty(); // Tabelle leeren
        const settings = getSettings($table);

        console.log("Build Table Settings:", settings); // Debugging für Einstellungen

        const $wrapper = $('<div class="' + wrapperClass + '"></div>').insertAfter($table);
        $table.appendTo($wrapper);
        $table.addClass(settings.classes);
        $('<thead></thead>').appendTo($table);
        $('<tbody></tbody>').appendTo($table);
        $('<tfoot></tfoot>').appendTo($table);

        if (settings.toolbar && $(settings.toolbar).length > 0) {
            $(settings.toolbar).prependTo($wrapper);
        }

        const $paginationContainer = $('<div class="bs-table-pagination"></div>').appendTo($wrapper);

        // Überprüfung der Datenquelle
        if (settings.sidePagination === 'server') {
            if (!settings.url) {
                console.error("Keine URL definiert für den serverseitigen Modus!");
                return;
            }
            fetchDataWithPromise($table)
                .then((response) => {
                    if (!response.rows || !response.rows.length) {
                        console.error("Keine Daten vom Server erhalten. Überprüfe die Antwortstruktur.");
                    }
                    renderTableWithPagination($table, settings, response, $paginationContainer);
                })
                .catch((error) => {
                    console.error("Fehler beim Abrufen der Server-Daten:", error.message);
                });
        } else if (settings.sidePagination === 'client') {
            if (settings.data && Array.isArray(settings.data) && settings.data.length > 0) {
                // Verwende lokale Daten
                const clientResponse = { rows: settings.data, total: settings.data.length };
                renderTableWithPagination($table, settings, clientResponse, $paginationContainer);
            } else if (settings.url) {
                console.log("Client-seitige Pagination: Daten werden von der URL geladen.");
                fetchDataWithPromise($table)
                    .then((response) => {
                        settings.data = response.rows || response; // Daten speichern
                        renderTableWithPagination($table, settings, { rows: settings.data, total: settings.data.length }, $paginationContainer);
                    })
                    .catch((error) => {
                        console.error("Fehler beim Abrufen der Daten:", error.message);
                    });
            } else {
                console.error("Keine client-seitigen Daten verfügbar und keine URL definiert!");
            }
        }
    }

    function renderTableWithPagination($table, settings, response, $paginationContainer) {
        console.log("RenderTable Input Data:", response); // Debugging
        const totalRows = response.total || (response.rows ? response.rows.length : 0);
        const pageSize = settings.pageSize;
        const pageNumber = settings.pageNumber;

        let currentPageData = response.rows;
        if (settings.sidePagination === 'client') {
            const start = (pageNumber - 1) * pageSize;
            const end = start + pageSize;
            currentPageData = response.rows.slice(start, end);
        }

        console.log("Current Page Data:", currentPageData); // Debugging
        console.log("Columns:", settings.columns); // Debugging

        if (settings.columns && settings.columns.length) {
            buildTableHeader($table, settings.columns);
            buildTableBody($table, currentPageData);
            buildTableFooter($table, settings.columns, response.rows);
        } else {
            console.log("Keine Spalten definiert!");
        }

        if (settings.pagination && $paginationContainer.length) {
            createPagination($paginationContainer, $table, totalRows);
        }
    }
    function createPagination($paginationContainer, $table, totalRows) {
        const settings = getSettings($table);

        // Berechne die Gesamtanzahl an Seiten
        const totalPages = Math.ceil(totalRows / settings.pageSize);
        const currentPage = settings.pageNumber || 1;

        // Entferne alte Pagination
        $paginationContainer.empty();

        // Bootstrap Pagination Wrapper erstellen
        const $pagination = $('<nav></nav>', {
            'aria-label': 'Table pagination'
        }).appendTo($paginationContainer);

        const $paginationList = $('<ul></ul>', {
            class: 'pagination justify-content-center'
        }).appendTo($pagination);

        // "Vorherige"-Button
        const $prevItem = $('<li></li>', {
            class: `page-item ${currentPage === 1 ? 'disabled' : ''}`
        }).appendTo($paginationList);

        $('<a></a>', {
            class: 'page-link',
            href: '#',
            tabindex: currentPage === 1 ? '-1' : '',
            'aria-disabled': currentPage === 1 ? 'true' : 'false',
            html: '&laquo;', // Pfeil zurück
        }).appendTo($prevItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage > 1) {
                settings.pageNumber = currentPage - 1; // Vorherige Seite
                setSettings($table, settings);
                handlePaginationChange($table); // Daten neu laden
            }
        });

        // Seiten-Buttons erstellen
        for (let i = 1; i <= totalPages; i++) {
            const $pageItem = $('<li></li>', {
                class: `page-item ${i === currentPage ? 'active' : ''}`,
            }).appendTo($paginationList);

            $('<a></a>', {
                class: 'page-link',
                href: '#',
                text: i,
            }).appendTo($pageItem).on('click', function (e) {
                e.preventDefault();
                if (i !== currentPage) {
                    settings.pageNumber = i; // Neue Seite setzen
                    setSettings($table, settings);
                    handlePaginationChange($table); // Daten neu laden
                }
            });
        }

        // "Nächste"-Button
        const $nextItem = $('<li></li>', {
            class: `page-item ${currentPage === totalPages ? 'disabled' : ''}`
        }).appendTo($paginationList);

        $('<a></a>', {
            class: 'page-link',
            href: '#',
            tabindex: currentPage === totalPages ? '-1' : '',
            'aria-disabled': currentPage === totalPages ? 'true' : 'false',
            html: '&raquo;', // Pfeil vorwärts
        }).appendTo($nextItem).on('click', function (e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                settings.pageNumber = currentPage + 1; // Nächste Seite
                setSettings($table, settings);
                handlePaginationChange($table); // Daten neu laden
            }
        });
    }

    function handlePaginationChange($table) {
        const settings = getSettings($table);

        if (settings.sidePagination === 'server') {
            fetchDataWithPromise($table)
                .then((response) => {
                    // Erneut rendern
                    const $paginationContainer = $table.closest(`.${wrapperClass}`).find('.bs-table-pagination');
                    renderTableWithPagination($table, settings, response, $paginationContainer);
                })
                .catch((error) => {
                    console.error("Fehler beim Abruf der Server-Daten:", error.message);
                });
        } else if (settings.sidePagination === 'client') {
            // Nur Daten von settings.data verwenden
            const totalRows = settings.data.length;
            const $paginationContainer = $table.closest(`.${wrapperClass}`).find('.bs-table-pagination');
            renderTableWithPagination($table, settings, { rows: settings.data, total: totalRows }, $paginationContainer);
        }
    }
    function buildTableHeader($table, columns) {
        const settings = getSettings($table);
        if (settings.showHeader === false) {
            return;
        }
        if (columns && columns.length) {
            const $thead = $table.find('thead').empty();
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
        if (columns && columns.length) {
            const $tfoot = $table.find('tfoot').empty();
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
        if (rows && rows.length) {
            const $tbody = $table.find('tbody').empty();
            let trIndex = 0;
            rows.forEach(row => {
                const $tr = $('<tr>', {
                    'data-index': trIndex,
                }).appendTo($tbody);
                if (settings.columns && settings.columns.length) {
                    settings.columns.forEach(column => {
                        buildTableBodyTd(column, row, $tr);
                    })
                }
                trIndex++;
            })
        }
    }

    function buildTableBodyTd(column, row, $tr) {
        if (column.field && row[column.field] !== undefined) {
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

            // Hole den Zellenwert (kann variabel sein)
            let value = row[column.field];
            if (column.formatter && typeof column.formatter === 'function') {
                value = column.formatter(value, row, $tr.data('index'));
            }

            // Erstelle die `td`-Zelle mit Klassen und Wert
            const $td = $('<td>', {
                class: classList.join(' '),
                html: value, // Variabler Inhalt wird eingefügt
            }).appendTo($tr);

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
                            eventHandler(e, row[column.field], row, index);
                        });
                    } else {
                        // Binde das Event direkt an die Zelle, wenn kein Selektor vorhanden ist
                        $td.on(eventTypes, function (e) {
                            const index = $tr.data('index'); // Hole Zeilenindex
                            eventHandler(e, row[column.field], row, index);
                        });
                    }
                }
            }
        }
    }

    function getSettings($table) {
        return $table.data('bsTable').settings;
    }

    function setSettings($table, settings) {
        const data = $table.data('bsTable');
        if (data) {
            data.settings = settings;
        }
        $table.data('bsTable', data);
    }
}(jQuery))