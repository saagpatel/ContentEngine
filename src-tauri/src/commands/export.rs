use tauri::AppHandle;
use tauri::Manager;

use crate::commands::history::get_history_detail;
use crate::errors::AppError;
use crate::services::markdown_export::MarkdownExporter;

#[tauri::command]
pub async fn export_markdown(app: AppHandle, content_input_id: String) -> Result<String, AppError> {
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
        .map_err(|e| AppError::ExportError(format!("Failed to get app data dir: {}", e)))?;
    let exports_dir = app_dir.join("exports");
    std::fs::create_dir_all(&exports_dir)
        .map_err(|e| AppError::ExportError(format!("Failed to create exports dir: {}", e)))?;

    // Export to markdown
    let export_data = MarkdownExporter::export(&detail.input, &detail.outputs, &exports_dir)?;

    Ok(export_data.file_path)
}
