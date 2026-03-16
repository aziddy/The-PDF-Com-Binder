import { useState, useRef, useCallback } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import FileDropZone from './FileDropZone';
import PageThumbnail from './PageThumbnail';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function parsePageRange(text, maxPage) {
  const selected = new Set();
  const parts = text.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      for (let i = Math.max(1, start); i <= Math.min(maxPage, end); i++) {
        selected.add(i - 1);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num) && num >= 1 && num <= maxPage) {
        selected.add(num - 1);
      }
    }
  }
  return selected;
}

function formatPageRange(selectedSet) {
  if (selectedSet.size === 0) return '';
  const sorted = Array.from(selectedSet).sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
  return ranges.join(', ');
}

function ExtractMode() {
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [pageRangeText, setPageRangeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const pdfDocRef = useRef(null);

  const handleFileSelected = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setRendering(true);
    setSourceFile(file);
    setSourceFileName(file.name);
    setSelectedPages(new Set());
    setPageRangeText('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = doc;
      setPageCount(doc.numPages);
    } catch (err) {
      console.error('Error loading PDF:', err);
      setSourceFile(null);
      setSourceFileName('');
    } finally {
      setRendering(false);
    }
  }, []);

  const togglePage = (pageIndex) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      setPageRangeText(formatPageRange(next, pageCount));
      return next;
    });
  };

  const selectAll = () => {
    const all = new Set(Array.from({ length: pageCount }, (_, i) => i));
    setSelectedPages(all);
    setPageRangeText(formatPageRange(all, pageCount));
  };

  const deselectAll = () => {
    setSelectedPages(new Set());
    setPageRangeText('');
  };

  const handleRangeTextChange = (e) => {
    const text = e.target.value;
    setPageRangeText(text);
    const parsed = parsePageRange(text, pageCount);
    setSelectedPages(parsed);
  };

  const reset = () => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    setSourceFile(null);
    setSourceFileName('');
    setPageCount(0);
    setSelectedPages(new Set());
    setPageRangeText('');
  };

  const extractPages = async () => {
    if (selectedPages.size === 0 || !sourceFile) return;

    try {
      setLoading(true);
      const arrayBuffer = await sourceFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      const indices = Array.from(selectedPages).sort((a, b) => a - b);
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page) => newDoc.addPage(page));

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = sourceFileName.replace(/\.pdf$/i, '');
      const rangeStr = formatPageRange(selectedPages, pageCount);
      const safeName = rangeStr.length <= 50
        ? `${baseName}_pages_${rangeStr.replace(/,\s*/g, '_')}.pdf`
        : `${baseName}_extracted.pdf`;

      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error extracting pages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!sourceFile) {
    return (
      <FileDropZone
        onFilesSelected={handleFileSelected}
        multiple={false}
        label="Upload a PDF"
        description="Select a PDF file to extract pages from, or drag and drop it here"
      />
    );
  }

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography>
          <strong>{sourceFileName}</strong> — {pageCount} page{pageCount !== 1 ? 's' : ''}
        </Typography>
        <Button variant="outlined" size="small" onClick={reset}>
          Choose Different File
        </Button>
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Page range"
          placeholder="e.g., 1-5, 8, 11-13"
          value={pageRangeText}
          onChange={handleRangeTextChange}
          sx={{ minWidth: 200 }}
        />
        <Button variant="outlined" size="small" onClick={selectAll}>
          Select All
        </Button>
        <Button variant="outlined" size="small" onClick={deselectAll}>
          Deselect All
        </Button>
        <Typography variant="body2" color="text.secondary">
          {selectedPages.size} of {pageCount} selected
        </Typography>
      </Box>

      {rendering ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>Loading pages...</Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          {Array.from({ length: pageCount }, (_, i) => (
            <PageThumbnail
              key={i}
              pdfDoc={pdfDocRef.current}
              pageIndex={i}
              selected={selectedPages.has(i)}
              onToggle={() => togglePage(i)}
            />
          ))}
        </Box>
      )}

      <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={extractPages}
          disabled={selectedPages.size === 0 || loading}
          size="large"
        >
          {loading ? 'Extracting...' : `Extract ${selectedPages.size} Page${selectedPages.size !== 1 ? 's' : ''}`}
        </Button>
      </Box>
    </>
  );
}

export default ExtractMode;
