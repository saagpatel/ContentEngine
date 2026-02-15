use crate::errors::AppError;
use crate::models::content::{ContentInput, RepurposedOutput};
use std::fs::File;
use std::io::Write;
use std::path::Path;

/// Export repurposed content to Markdown format
pub struct MarkdownExporter;

impl MarkdownExporter {
    /// Export content and outputs to a Markdown file
    pub fn export(
        content: &ContentInput,
        outputs: &[RepurposedOutput],
        export_dir: &Path,
    ) -> Result<ExportData, AppError> {
        let mut markdown = String::new();

        // Header
        markdown.push_str(&format!(
            "# {}\n\n",
            content.title.as_deref().unwrap_or("Untitled")
        ));

        // Metadata
        if let Some(url) = &content.source_url {
            markdown.push_str(&format!("**Source:** {}\n\n", url));
        }
        markdown.push_str(&format!("**Word count:** {}\n\n", content.word_count));
        markdown.push_str(&format!("**Created:** {}\n\n", content.created_at));
        markdown.push_str("---\n\n");

        // Original content
        markdown.push_str("## Original Content\n\n");
        markdown.push_str(&content.raw_text);
        markdown.push_str("\n\n---\n\n");

        // Outputs
        markdown.push_str("## Repurposed Formats\n\n");

        for output in outputs {
            markdown.push_str(&format!("### {}\n\n", Self::format_display_name(&output.format)));

            // Format-specific rendering
            match output.format.as_str() {
                "twitter" => {
                    markdown.push_str("```\n");
                    markdown.push_str(&output.output_text);
                    markdown.push_str("\n```\n\n");
                }
                "email" => {
                    markdown.push_str(&output.output_text);
                    markdown.push_str("\n\n");
                }
                _ => {
                    markdown.push_str(&output.output_text);
                    markdown.push_str("\n\n");
                }
            }

            markdown.push_str("---\n\n");
        }

        // Write to file
        let timestamp = chrono::Utc::now().format("%Y%m%d-%H%M%S");
        let filename = format!("{}-{}.md", content.id, timestamp);
        let file_path = export_dir.join(&filename);

        let mut file =
            File::create(&file_path).map_err(|e| AppError::ExportError(e.to_string()))?;

        file.write_all(markdown.as_bytes())
            .map_err(|e| AppError::ExportError(e.to_string()))?;

        let file_size = std::fs::metadata(&file_path)
            .map(|m| m.len() as usize)
            .unwrap_or(0);

        tracing::info!(
            file_path = %file_path.display(),
            file_size,
            formats = outputs.len(),
            "Markdown export completed"
        );

        Ok(ExportData {
            file_path: file_path.to_string_lossy().to_string(),
            file_size_bytes: file_size,
            markdown_content: markdown,
        })
    }

    /// Format display name for output format
    fn format_display_name(format: &str) -> String {
        match format {
            "twitter" => "Twitter Thread".to_string(),
            "linkedin" => "LinkedIn Post".to_string(),
            "instagram" => "Instagram Caption".to_string(),
            "newsletter" => "Newsletter Excerpt".to_string(),
            "email" => "Email Sequence".to_string(),
            "summary" => "Short Summary".to_string(),
            _ => format.to_string(),
        }
    }
}

/// Export data returned to frontend
#[derive(Debug, serde::Serialize)]
pub struct ExportData {
    pub file_path: String,
    pub file_size_bytes: usize,
    pub markdown_content: String,
}
