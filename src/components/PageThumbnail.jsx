import { useEffect, useRef, useState } from 'react';
import { Box, Checkbox, Typography } from '@mui/material';
import PropTypes from 'prop-types';

function PageThumbnail({ pdfDoc, pageIndex, selected, onToggle }) {
  const canvasRef = useRef(null);
  const [rendered, setRendered] = useState(false);

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

  return (
    <Box
      onClick={onToggle}
      sx={{
        position: 'relative',
        cursor: 'pointer',
        border: 2,
        borderColor: selected ? 'primary.main' : 'grey.300',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        transition: 'border-color 0.15s ease',
        '&:hover': {
          borderColor: selected ? 'primary.dark' : 'grey.500',
        },
      }}
    >
      <Checkbox
        checked={selected}
        onChange={onToggle}
        onClick={(e) => e.stopPropagation()}
        size="small"
        sx={{
          position: 'absolute',
          top: 2,
          left: 2,
          zIndex: 1,
          backgroundColor: 'rgba(255,255,255,0.8)',
          borderRadius: '4px',
          p: '2px',
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          opacity: rendered ? 1 : 0.3,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          py: 0.5,
          backgroundColor: selected ? 'primary.main' : 'grey.200',
          color: selected ? 'white' : 'text.secondary',
          transition: 'all 0.15s ease',
        }}
      >
        Page {pageIndex + 1}
      </Typography>
    </Box>
  );
}

PageThumbnail.propTypes = {
  pdfDoc: PropTypes.object,
  pageIndex: PropTypes.number.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default PageThumbnail;
