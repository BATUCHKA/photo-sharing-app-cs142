// client/src/components/layout/Alert.js
import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const AlertComponent = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Alert = ({ alert }) => {
  if (!alert) return null;
  
  return (
    <Snackbar 
      open={!!alert} 
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <AlertComponent 
        severity={alert.severity || 'info'} 
        sx={{ width: '100%' }}
      >
        {alert.message}
      </AlertComponent>
    </Snackbar>
  );
};

export default Alert;