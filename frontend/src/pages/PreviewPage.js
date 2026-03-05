import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { Box, IconButton, Paper, Typography, alpha, useTheme } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import DocumentViewer from "../components/DocumentViewer";

const PreviewPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const originalPath = searchParams.get("original");
  const correctedPath = searchParams.get("corrected");
  const filename = searchParams.get("filename") || "Document";

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 2, pb: 0, zIndex: 10 }}>
        <Paper
          elevation={0}
          className="glass-card"
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <IconButton
            onClick={handleBack}
            size="small"
            sx={{
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 1,
              color: "rgba(255,255,255,0.5)",
              "&:hover": { color: "#fff", borderColor: "rgba(255,255,255,0.3)" },
            }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: alpha(theme.palette.common.white, 0.8),
                fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif',
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                userSelect: "none",
              }}
            >
              CURSA / PREVIEW
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <InsertDriveFileIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {filename}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: "hidden", p: 2 }}>
        <DocumentViewer originalPath={originalPath} correctedPath={correctedPath} />
      </Box>
    </Box>
  );
};

export default PreviewPage;
