import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  IconButton
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import { PDFDocument } from 'pdf-lib';
import FileDropZone from './FileDropZone';

function CombineMode() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFilesSelected = async (files) => {
    const newPdfFiles = files.map((file) => ({
      file,
      name: file.name,
    }));
    setPdfFiles(prev => [...prev, ...newPdfFiles]);
  };

  const handleRemove = (index) => {
    const newFiles = [...pdfFiles];
    newFiles.splice(index, 1);
    setPdfFiles(newFiles);
  };

  const moveFile = (index, direction) => {
    const newFiles = [...pdfFiles];
    const temp = newFiles[index];
    newFiles[index] = newFiles[index + direction];
    newFiles[index + direction] = temp;
    setPdfFiles(newFiles);
  };

  const combinePDFs = async () => {
    try {
      setLoading(true);
      const mergedPdf = await PDFDocument.create();

      for (const pdfFile of pdfFiles) {
        const fileBuffer = await pdfFile.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfFile = await mergedPdf.save();
      const blob = new Blob([mergedPdfFile], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'combined.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error combining PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FileDropZone
        onFilesSelected={handleFilesSelected}
        multiple
        label="Upload PDFs"
        description="Select multiple PDF files to combine or drag and drop them here"
      />

      {pdfFiles.length > 0 && (
        <List>
          {pdfFiles.map((pdf, index) => (
            <ListItem
              key={index}
              sx={{
                mb: 2,
                border: '1px solid #eee',
                borderRadius: 1,
              }}
            >
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                <Typography>{pdf.name}</Typography>
                <Box sx={{ ml: 'auto', display: 'flex' }}>
                  {index > 0 && (
                    <IconButton onClick={() => moveFile(index, -1)}>
                      <ArrowUpwardIcon />
                    </IconButton>
                  )}
                  {index < pdfFiles.length - 1 && (
                    <IconButton onClick={() => moveFile(index, 1)}>
                      <ArrowDownwardIcon />
                    </IconButton>
                  )}
                  <IconButton onClick={() => handleRemove(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      {pdfFiles.length > 1 && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={combinePDFs}
            disabled={loading}
          >
            {loading ? 'Combining...' : 'Combine PDFs'}
          </Button>
        </Box>
      )}
    </>
  );
}

export default CombineMode;
