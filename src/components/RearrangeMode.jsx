import { useState, useRef, useCallback } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import FileDropZone from './FileDropZone';
import RearrangePageThumbnail from './RearrangePageThumbnail';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

function RearrangeMode() {
  const [sourceFile, setSourceFile] = useState(null);
  const [sourceFileName, setSourceFileName] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rendering, setRendering] = useState(false);
  const pdfDocRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleFileSelected = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    setRendering(true);
    setSourceFile(file);
    setSourceFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = doc;
      setPageCount(doc.numPages);
      setPages(Array.from({ length: doc.numPages }, (_, i) => ({ originalIndex: i, rotation: 0 })));
    } catch (err) {
      console.error('Error loading PDF:', err);
      setSourceFile(null);
      setSourceFileName('');
    } finally {
      setRendering(false);
    }
  }, []);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPages(prev => {
      const oldIndex = prev.findIndex(p => `page-${p.originalIndex}` === active.id);
      const newIndex = prev.findIndex(p => `page-${p.originalIndex}` === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleDelete = (displayIndex) => {
    setPages(prev => prev.filter((_, i) => i !== displayIndex));
  };

  const handleRotate = (displayIndex) => {
    setPages(prev => prev.map((p, i) =>
      i === displayIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p
    ));
  };

  const resetOrder = () => {
    setPages(Array.from({ length: pageCount }, (_, i) => ({ originalIndex: i, rotation: 0 })));
  };

  const reset = () => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    setSourceFile(null);
    setSourceFileName('');
    setPageCount(0);
    setPages([]);
  };

  const isUnchanged = pages.length === pageCount && pages.every((p, i) => p.originalIndex === i && p.rotation === 0);

  const savePdf = async () => {
    if (pages.length === 0 || !sourceFile) return;

    try {
      setLoading(true);
      const arrayBuffer = await sourceFile.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const newDoc = await PDFDocument.create();

      const indices = pages.map(p => p.originalIndex);
      const copiedPages = await newDoc.copyPages(srcDoc, indices);
      copiedPages.forEach((page, i) => {
        if (pages[i].rotation !== 0) {
          page.setRotation(degrees(page.getRotation().angle + pages[i].rotation));
        }
        newDoc.addPage(page);
      });

      const pdfBytes = await newDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const baseName = sourceFileName.replace(/\.pdf$/i, '');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${baseName}_rearranged.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving rearranged PDF:', error);
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
        description="Select a PDF to rearrange or delete pages, or drag and drop it here"
      />
    );
  }

  const deletedCount = pageCount - pages.length;
  const sortableIds = pages.map(p => `page-${p.originalIndex}`);

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
        <Button variant="outlined" size="small" onClick={resetOrder} disabled={isUnchanged}>
          Reset Order
        </Button>
        <Typography variant="body2" color="text.secondary">
          {pages.length} page{pages.length !== 1 ? 's' : ''} remaining
          {deletedCount > 0 && ` (${deletedCount} removed)`}
        </Typography>
      </Box>

      {rendering ? (
        <Typography sx={{ textAlign: 'center', py: 4 }}>Loading pages...</Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 2,
                mb: 3,
              }}
            >
              {pages.map((page, i) => (
                <RearrangePageThumbnail
                  key={`page-${page.originalIndex}`}
                  id={`page-${page.originalIndex}`}
                  pdfDoc={pdfDocRef.current}
                  pageIndex={page.originalIndex}
                  displayIndex={i}
                  totalPages={pages.length}
                  rotation={page.rotation}
                  onDelete={() => handleDelete(i)}
                  onRotate={() => handleRotate(i)}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>
      )}

      <Box sx={{ textAlign: 'center', mt: 2, mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={savePdf}
          disabled={pages.length === 0 || isUnchanged || loading}
          size="large"
        >
          {loading ? 'Saving...' : 'Save Rearranged PDF'}
        </Button>
      </Box>
    </>
  );
}

export default RearrangeMode;
