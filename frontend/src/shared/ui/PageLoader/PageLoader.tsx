import { CircularProgress, Box } from '@mui/material';

/**
 * PageLoader - полноэкранный лоадер
 * 
 * Используется при загрузке страницы или крупных секций.
 */
export const PageLoader = () => (
  <Box
    className="page-loader"
    data-testid="page-loader"
    sx={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    }}
  >
    <CircularProgress />
  </Box>
);
