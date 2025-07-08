document.addEventListener('DOMContentLoaded', () => {
  const tables = document.querySelectorAll('table[data-auto="dt"]');

  tables.forEach((table) => {
    if (!table.classList.contains('datatable-init')) {
      new simpleDatatables.DataTable(table, {
        perPage: 10,
        labels: {
          placeholder: "🔍 Buscar...",
          perPage: "", // no insertamos nada desde JS
          noRows: "No hay datos para mostrar",
          info: "Mostrando {start}–{end} de {rows} registros",
          pagination: {
            previous: "Anterior",
            next: "Siguiente"
          }
        }
      });

      table.classList.add('datatable-init');
    }
  });
});
