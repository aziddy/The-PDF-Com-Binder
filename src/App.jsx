import { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  Paper,
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

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (files) => {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    const newPdfFiles = await Promise.all(
      pdfFiles.map(async (file) => ({
        file,
        name: file.name,
        preview: URL.createObjectURL(file)
      }))
    );
    setPdfFiles(prev => [...prev, ...newPdfFiles]);
  };

  const handleFileUpload = async (event) => {
    await processFiles(event.target.files);
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (items && items.length > 0) {
      await processFiles(files);
    }
  }, []);

  const handleRemove = (index) => {
    const newFiles = [...pdfFiles];
    URL.revokeObjectURL(newFiles[index].preview);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        PDF Com-Biner
      </Typography>
      
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3, 
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : '#ccc',
          textAlign: 'center',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          transition: 'all 0.2s ease',
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button variant="contained" component="span">
            Upload PDFs
          </Button>
        </label>
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Select multiple PDF files to combine or drag and drop them here
        </Typography>
      </Paper>

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
    </Container>
  );
}

export default App;
