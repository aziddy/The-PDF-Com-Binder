import { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab } from '@mui/material';
import CombineMode from './components/CombineMode';
import ExtractMode from './components/ExtractMode';

function App() {
  const [mode, setMode] = useState('combine');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        PDF Com-Binder
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={mode} onChange={(_, v) => setMode(v)} centered>
          <Tab label="Combine PDFs" value="combine" />
          <Tab label="Extract Pages" value="extract" />
        </Tabs>
      </Box>

      {mode === 'combine' && <CombineMode />}
      {mode === 'extract' && <ExtractMode />}
    </Container>
  );
}

export default App;
