use printpdf::*;

use crate::errors::AppError;
use crate::models::content::{ContentInput, RepurposedOutput};

const PAGE_WIDTH_MM: f32 = 210.0;
const PAGE_HEIGHT_MM: f32 = 297.0;
const LEFT_MARGIN_MM: f32 = 15.0;
const TOP_MARGIN_MM: f32 = 20.0;
const LINE_HEIGHT_PT: f32 = 14.0;
const BODY_FONT_PT: f32 = 11.0;
const TITLE_FONT_PT: f32 = 20.0;
const SECTION_FONT_PT: f32 = 14.0;
const MAX_LINE_CHARS: usize = 92;
const MAX_LINES_PER_PAGE: usize = 52;

pub fn export_to_pdf(
    input: &ContentInput,
    outputs: &[RepurposedOutput],
    output_path: &str,
) -> Result<String, AppError> {
    let title = input.title.as_deref().unwrap_or("Untitled Content");

    let mut doc = PdfDocument::new(title);
    let pages = render_pages(input, outputs, title);
    let mut warnings = Vec::new();
    let bytes = doc
        .with_pages(pages)
        .save(&PdfSaveOptions::default(), &mut warnings);

    std::fs::write(output_path, &bytes)
        .map_err(|e| AppError::PdfExport(format!("Failed to write PDF file: {}", e)))?;

    Ok(output_path.to_string())
}

fn render_pages(input: &ContentInput, outputs: &[RepurposedOutput], title: &str) -> Vec<PdfPage> {
    let mut builder = PageBuilder::new();

    builder.add_text(title, BuiltinFont::HelveticaBold, TITLE_FONT_PT);
    builder.add_text(
        &format!("Word Count: {} | Created: {}", input.word_count, input.created_at),
        BuiltinFont::Helvetica,
        BODY_FONT_PT,
    );
    if let Some(ref url) = input.source_url {
        builder.add_wrapped_text(
            &format!("Source: {}", url),
            BuiltinFont::Helvetica,
            BODY_FONT_PT,
        );
    }
    builder.add_blank_line();

    for output in outputs {
        builder.add_text(
            &format_display_name(&output.format),
            BuiltinFont::HelveticaBold,
            SECTION_FONT_PT,
        );

        for line in output.output_text.lines() {
            if line.trim().is_empty() {
                builder.add_blank_line();
            } else {
                builder.add_wrapped_text(line, BuiltinFont::Helvetica, BODY_FONT_PT);
            }
        }
        builder.add_blank_line();
    }

    builder.finish()
}

fn format_display_name(format: &str) -> String {
    match format {
        "twitter_thread" => "Twitter/X Thread".to_string(),
        "linkedin" => "LinkedIn Post".to_string(),
        "instagram" => "Instagram Caption".to_string(),
        "newsletter" => "Newsletter".to_string(),
        "email_sequence" => "Email Sequence".to_string(),
        "summary" => "Summary".to_string(),
        other => other.to_string(),
    }
}

struct PageBuilder {
    pages: Vec<PdfPage>,
    ops: Vec<Op>,
    line_count: usize,
}

impl PageBuilder {
    fn new() -> Self {
        Self {
            pages: Vec::new(),
            ops: Vec::new(),
            line_count: 0,
        }
    }

    fn add_text(&mut self, text: &str, font: BuiltinFont, size: f32) {
        self.ensure_page();
        self.ops.push(Op::SetFont {
            font: PdfFontHandle::Builtin(font),
            size: Pt(size),
        });
        self.ops.push(Op::SetLineHeight {
            lh: Pt(LINE_HEIGHT_PT),
        });
        self.ops.push(Op::ShowText {
            items: vec![TextItem::Text(text.to_string())],
        });
        self.ops.push(Op::AddLineBreak);
        self.line_count += 1;
    }

    fn add_wrapped_text(&mut self, text: &str, font: BuiltinFont, size: f32) {
        for line in wrap_line(text) {
            self.add_text(&line, font, size);
        }
    }

    fn add_blank_line(&mut self) {
        self.ensure_page();
        self.ops.push(Op::AddLineBreak);
        self.line_count += 1;
    }

    fn ensure_page(&mut self) {
        if self.ops.is_empty() {
            self.start_page();
        } else if self.line_count >= MAX_LINES_PER_PAGE {
            self.finish_page();
            self.start_page();
        }
    }

    fn start_page(&mut self) {
        self.ops.push(Op::SaveGraphicsState);
        self.ops.push(Op::StartTextSection);
        self.ops.push(Op::SetTextCursor {
            pos: Point::new(Mm(LEFT_MARGIN_MM), Mm(PAGE_HEIGHT_MM - TOP_MARGIN_MM)),
        });
        self.line_count = 0;
    }

    fn finish_page(&mut self) {
        self.ops.push(Op::EndTextSection);
        self.ops.push(Op::RestoreGraphicsState);
        let ops = std::mem::take(&mut self.ops);
        self.pages
            .push(PdfPage::new(Mm(PAGE_WIDTH_MM), Mm(PAGE_HEIGHT_MM), ops));
    }

    fn finish(mut self) -> Vec<PdfPage> {
        if self.ops.is_empty() {
            self.start_page();
        }
        self.finish_page();
        self.pages
    }
}

fn wrap_line(line: &str) -> Vec<String> {
    let mut wrapped = Vec::new();
    let mut current = String::new();

    for word in line.split_whitespace() {
        let next_len = current.len() + usize::from(!current.is_empty()) + word.len();
        if next_len > MAX_LINE_CHARS && !current.is_empty() {
            wrapped.push(current);
            current = word.to_string();
        } else {
            if !current.is_empty() {
                current.push(' ');
            }
            current.push_str(word);
        }
    }

    if current.is_empty() {
        wrapped.push(String::new());
    } else {
        wrapped.push(current);
    }

    wrapped
}

#[cfg(test)]
mod tests {
    use super::export_to_pdf;
    use crate::models::content::{ContentInput, RepurposedOutput};
    use std::path::Path;

    fn test_input() -> ContentInput {
        ContentInput {
            id: "content-1".to_string(),
            source_url: Some("https://example.com/article".to_string()),
            raw_text: "Original source text for testing".to_string(),
            title: Some("Test Export".to_string()),
            word_count: 5,
            created_at: "2026-03-01T00:00:00Z".to_string(),
        }
    }

    fn test_outputs() -> Vec<RepurposedOutput> {
        vec![RepurposedOutput {
            id: "output-1".to_string(),
            content_input_id: "content-1".to_string(),
            format: "linkedin".to_string(),
            output_text: "This is a LinkedIn draft.".to_string(),
            created_at: "2026-03-01T00:00:00Z".to_string(),
        }]
    }

    #[test]
    fn exports_pdf_to_file() {
        let temp = tempfile::tempdir().expect("create temp dir");
        let output_path = temp.path().join("export.pdf");

        let result = export_to_pdf(
            &test_input(),
            &test_outputs(),
            output_path.to_str().expect("utf8 output path"),
        )
        .expect("export should succeed");

        assert_eq!(result, output_path.to_string_lossy().to_string());
        assert!(Path::new(&result).exists(), "exported PDF should exist");

        let metadata = std::fs::metadata(&result).expect("read metadata");
        assert!(
            metadata.len() > 0,
            "exported PDF should not be an empty file"
        );
    }

    #[test]
    fn returns_error_when_parent_dir_is_missing() {
        let temp = tempfile::tempdir().expect("create temp dir");
        let output_path = temp.path().join("missing").join("export.pdf");

        let error = export_to_pdf(
            &test_input(),
            &test_outputs(),
            output_path.to_str().expect("utf8 output path"),
        )
        .expect_err("export should fail when parent directory is missing");

        let message = error.to_string();
        assert!(
            message.contains("PDF export error"),
            "error should map to PDF export failures"
        );
    }

    #[test]
    fn returns_error_when_output_path_is_directory() {
        let temp = tempfile::tempdir().expect("create temp dir");

        let error = export_to_pdf(
            &test_input(),
            &test_outputs(),
            temp.path().to_str().expect("utf8 output path"),
        )
        .expect_err("export should fail when output path points to a directory");

        let message = error.to_string();
        assert!(
            message.contains("PDF export error"),
            "directory write failure should map to PDF export error"
        );
    }
}
