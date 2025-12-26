import * as React from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export function SnackBar({
  message = "",
  severity = "success",
  state = false,
}) {
  const [open, setOpen] = React.useState(state);

  const handleClose = (event, reason) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };
console.log(message);
console.log(severity);
console.log(state);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
