use tauri::AppHandle;
use tauri::Manager;

use crate::commands::history::get_history_detail;
use crate::errors::AppError;
use crate::services::pdf_export::export_to_pdf;

#[tauri::command]
pub async fn export_pdf(app: AppHandle, content_input_id: String) -> Result<String, AppError> {
    let detail = get_history_detail(app.clone(), content_input_id.clone()).await?;

    if detail.outputs.is_empty() {
        return Err(AppError::Validation(
            "No outputs to export".to_string(),
        ));
    }

    // Create output path in app data dir
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::PdfExport(format!("Failed to get app data dir: {}", e)))?;
    let exports_dir = app_dir.join("exports");
    std::fs::create_dir_all(&exports_dir)
        .map_err(|e| AppError::PdfExport(format!("Failed to create exports dir: {}", e)))?;

    let timestamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
    let file_path = exports_dir.join(format!("{}-{}.pdf", content_input_id, timestamp));
    let file_path_string = file_path.to_string_lossy().to_string();

    export_to_pdf(&detail.input, &detail.outputs, &file_path_string)?;

    Ok(file_path_string)
}
