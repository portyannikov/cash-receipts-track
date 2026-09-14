import { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./DataTable.css";

const PAGE_SIZE = 15;

const columns = [
  { key: "platform", label: "Платформа" },
  { key: "fullName", label: "Повне ім’я" },
  { key: "iban", label: "IBAN" },
  { key: "bankName", label: "Назва банку" },
  {
    key: "ibanProblem",
    label: "Проблема з IBAN",
    problemTitle: "Проблема з IBAN",
  },
  { key: "taxId", label: "Ід. код" },
  {
    key: "taxIdProblem",
    label: "Проблема з Ід. код",
    problemTitle: "Проблема з Ід. код",
  },
  { key: "phone", label: "Телефон" },
  { key: "submittedDate", label: "Дата подання" },
];

function maskIban(iban) {
  const value = String(iban).replace(/\s/g, "");

  if (value.length <= 12) return "*".repeat(value.length);

  const visibleStart = value.slice(0, 8);
  const hiddenMiddle = value.slice(8, -4);
  const visibleEnd = value.slice(-4);
  const maskedGroups = hiddenMiddle.match(/.{1,4}/g) ?? [];

  return `${visibleStart.slice(0, 4)} ${visibleStart.slice(4)} ${maskedGroups
    .map((group) => "*".repeat(group.length))
    .join(" ")} ${visibleEnd}`;
}

function maskTaxId(taxId) {
  const value = String(taxId);

  if (value.length <= 6) return "*".repeat(value.length);

  return `${value.slice(0, 4)}${"*".repeat(value.length - 6)}${value.slice(-2)}`;
}

function DataTable({ data, isLoading, error, onRetry }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const visibleRows = data.slice(0, visibleCount);
  const hasMoreRows = visibleCount < data.length;

  useEffect(() => {
    if (selectedProblem === null) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedProblem(null);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedProblem]);

  function getCellValue(row, key) {
    const value = row[key];
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");

    if (isEmpty) return "--";
    if (key === "iban") return maskIban(value);
    if (key === "taxId") return maskTaxId(value);

    return value;
  }

  function renderCell(row, column) {
    const value = getCellValue(row, column.key);

    if (!column.problemTitle || value === "--") return value;

    const isLong = String(value).length > 28;

    return (
      <button
        className={`problem-cell-button${isLong ? " problem-cell-button--long" : ""}`}
        type="button"
        onClick={() =>
          setSelectedProblem({
            title: column.problemTitle,
            text: String(value),
          })
        }
        title="Переглянути повний текст"
      >
        {value}
      </button>
    );
  }

  return (
    <section className="data-table-card" aria-labelledby="submissions-title">
      <div className="data-table-header">
        <div>
          <p className="data-table-eyebrow">Telegram</p>
          <h1 id="submissions-title">Подані заявки</h1>
        </div>
        <span className="data-table-count">
          {isLoading ? "Loading…" : `${data.length} records`}
        </span>
      </div>

      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="data-table-message" colSpan={columns.length}>
                  Loading submissions…
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td
                  className="data-table-message data-table-message--error"
                  colSpan={columns.length}
                >
                  {error}
                </td>
              </tr>
            )}

            {!isLoading && !error && data.length === 0 && (
              <tr>
                <td className="data-table-message" colSpan={columns.length}>
                  No submissions found.
                </td>
              </tr>
            )}

            {visibleRows.map((row) => (
              <tr key={`${row.taxId}-${row.submittedDate}`}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={column.problemTitle ? "problem-cell" : undefined}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && error && (
        <div className="data-table-footer">
          <button
            className="data-table-show-more"
            type="button"
            onClick={onRetry}
          >
            Try again
          </button>
        </div>
      )}

      {hasMoreRows && (
        <div className="data-table-footer">
          <button
            className="data-table-show-more"
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Show more
          </button>
        </div>
      )}

      {selectedProblem !== null && (
        <div
          className="problem-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedProblem(null);
          }}
        >
          <div
            className="problem-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="problem-modal-title"
          >
            <div className="problem-modal-header">
              <h2 id="problem-modal-title">{selectedProblem.title}</h2>
              <button
                className="problem-modal-close"
                type="button"
                onClick={() => setSelectedProblem(null)}
                aria-label="Close dialog"
                autoFocus
              >
                <X aria-hidden="true" />
              </button>
            </div>
            <p className="problem-modal-text">{selectedProblem.text}</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default DataTable;
