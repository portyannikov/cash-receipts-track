import { useEffect, useState } from "react";
import { Download, LoaderCircle, LogOut, Moon, Sun, X } from "lucide-react";
import "./ActionToolbar.css";

function getDownloadFilename(response, downloadUrl) {
  const disposition = response.headers.get("content-disposition") ?? "";
  const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];

  if (encodedName) {
    try {
      return decodeURIComponent(encodedName);
    } catch {
      return encodedName;
    }
  }

  if (plainName) return plainName;

  const pathName = new URL(downloadUrl, window.location.href).pathname;
  const pathFilename = pathName.split("/").filter(Boolean).pop();
  return pathFilename?.includes(".") ? pathFilename : "submissions.xlsx";
}

function ActionToolbar({ isDarkMode, onThemeToggle, downloadUrl, onLogout }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  useEffect(() => {
    if (!isDownloadModalOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setIsDownloadModalOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isDownloadModalOpen]);

  async function handleDownload(shouldRemoveData) {
    if (isDownloading) return;

    setIsDownloadModalOpen(false);
    setIsDownloading(true);

    try {
      const requestUrl = shouldRemoveData
        ? `${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}isRemove=1`
        : downloadUrl;
      const response = await fetch(requestUrl);

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      const file = await response.blob();
      const objectUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = getDownloadFilename(response, requestUrl);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Failed to download submissions:", error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <>
      <aside className="action-toolbar" aria-label="Page actions">
        <button
          className="action-toolbar-button"
          type="button"
          onClick={onThemeToggle}
          aria-label={isDarkMode ? "Turn on light mode" : "Turn on dark mode"}
          title={isDarkMode ? "Light mode" : "Dark mode"}
        >
          {isDarkMode ? (
            <Sun aria-hidden="true" />
          ) : (
            <Moon aria-hidden="true" />
          )}
        </button>

        <button
          className="action-toolbar-button"
          type="button"
          onClick={() => setIsDownloadModalOpen(true)}
          disabled={isDownloading}
          aria-label="Download submissions file"
          title={isDownloading ? "Downloading…" : "Download submissions file"}
        >
          {isDownloading ? (
            <LoaderCircle
              className="action-toolbar-spinner"
              aria-hidden="true"
            />
          ) : (
            <Download aria-hidden="true" />
          )}
        </button>

        <div className="action-toolbar-divider" />

        <button
          className="action-toolbar-button action-toolbar-button--logout"
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          title="Log out"
        >
          <LogOut aria-hidden="true" />
        </button>
      </aside>

      {isDownloadModalOpen && (
        <div
          className="download-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsDownloadModalOpen(false);
            }
          }}
        >
          <div
            className="download-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="download-modal-title"
          >
            <button
              className="download-modal-close"
              type="button"
              onClick={() => setIsDownloadModalOpen(false)}
              aria-label="Закрити вікно"
            >
              <X aria-hidden="true" />
            </button>

            <h2 id="download-modal-title">
              Бажаєте видалити дані після завантаження?
            </h2>

            <div className="download-modal-actions">
              <button
                className="download-modal-button download-modal-button--secondary"
                type="button"
                onClick={() => handleDownload(false)}
                autoFocus
              >
                НІ
              </button>
              <button
                className="download-modal-button download-modal-button--danger"
                type="button"
                onClick={() => handleDownload(true)}
              >
                ТАК
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ActionToolbar;
