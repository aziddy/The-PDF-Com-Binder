import { useEffect, useRef, useState } from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PropTypes from 'prop-types';

function RearrangePageThumbnail({ id, pdfDoc, pageIndex, displayIndex, totalPages, rotation, onDelete, onRotate }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  useEffect(() => {
    let cancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (cancelled) return;

        const scale = 0.3;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setRendered(true);
      } catch (err) {
        console.error(`Error rendering page ${pageIndex + 1}:`, err);
      }
    }

    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex]);

  const hasMoved = displayIndex !== pageIndex;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        position: 'relative',
        border: 2,
        borderColor: isDragging ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        transition: 'border-color 0.15s ease',
        cursor: 'grab',
        '&:hover': {
          borderColor: 'grey.500',
        },
      }}
    >
      {hasMoved && (
        <Chip
          label={`was #${pageIndex + 1}`}
          size="small"
          sx={{
            position: 'absolute',
            top: 2,
            left: 2,
            zIndex: 1,
            height: 20,
            fontSize: '0.65rem',
            backgroundColor: 'rgba(25, 118, 210, 0.85)',
            color: 'white',
            '& .MuiChip-label': { px: 0.75 },
          }}
        />
      )}
      <IconButton
        size="small"
        onClick={onRotate}
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 2,
          right: 30,
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.85)',
          '&:hover': { backgroundColor: 'primary.light', color: 'white' },
          p: '3px',
        }}
      >
        <RotateRightIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={onDelete}
        onPointerDown={(e) => e.stopPropagation()}
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.85)',
          '&:hover': { backgroundColor: 'error.light', color: 'white' },
          p: '3px',
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Box sx={{ overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            opacity: rendered ? 1 : 0.3,
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
            transition: 'transform 0.2s ease',
          }}
        />
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          backgroundColor: 'grey.200',
          px: 1,
          py: 0.5,
        }}
      >
        <DragIndicatorIcon fontSize="small" sx={{ color: 'grey.500' }} />
        <Typography variant="caption" color="text.secondary">
          Page {displayIndex + 1}
        </Typography>
      </Box>
    </Box>
  );
}

RearrangePageThumbnail.propTypes = {
  id: PropTypes.string.isRequired,
  pdfDoc: PropTypes.object,
  pageIndex: PropTypes.number.isRequired,
  displayIndex: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  rotation: PropTypes.number.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRotate: PropTypes.func.isRequired,
};

export default RearrangePageThumbnail;
