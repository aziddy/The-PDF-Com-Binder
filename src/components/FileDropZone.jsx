import { useState, useCallback } from 'react';
import { Button, Paper, Typography } from '@mui/material';
import PropTypes from 'prop-types';

function FileDropZone({ onFilesSelected, multiple = true, label = 'Upload PDFs', description }) {
  const [isDragging, setIsDragging] = useState(false);

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

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
      if (pdfFiles.length > 0) {
        onFilesSelected(multiple ? pdfFiles : [pdfFiles[0]]);
      }
    }
  }, [onFilesSelected, multiple]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files).filter(file => file.type === 'application/pdf');
    if (files.length > 0) {
      onFilesSelected(multiple ? files : [files[0]]);
    }
    event.target.value = '';
  };

  const inputId = `pdf-upload-${multiple ? 'multi' : 'single'}`;

  return (
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
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        id={inputId}
      />
      <label htmlFor={inputId}>
        <Button variant="contained" component="span">
          {label}
        </Button>
      </label>
      {description && (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          {description}
        </Typography>
      )}
    </Paper>
  );
}

FileDropZone.propTypes = {
  onFilesSelected: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  label: PropTypes.string,
  description: PropTypes.string,
};

export default FileDropZone;
