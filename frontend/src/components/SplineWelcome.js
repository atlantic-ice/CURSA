import { Close as CloseIcon, Replay as ReplayIcon } from "@mui/icons-material";
import { Box, Button, Dialog, IconButton } from "@mui/material";
import { useEffect, useState } from "react";

// Динамический импорт компонента Spline (возможно потребуется установка пакета)
let Spline = null;
try {
  // Попытка импорта если пакет установлен
  Spline = require("@splinetool/react-spline").default;
} catch (e) {
  console.warn("Spline пакет не установлен. Установите: npm install @splinetool/react-spline");
}

const SplineWelcome = ({
  sceneUrl = "https://prod.spline.design/Gr7QOhSlp3ZnGdxw/scene.splinecode",
}) => {
  const [showWelcome, setShowWelcome] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  // Проверка localStorage при загрузке
  useEffect(() => {
    const seen = localStorage.getItem("spline_welcome_seen");
    if (!seen) {
      setShowWelcome(true);
      setHasSeenWelcome(false);
    } else {
      setHasSeenWelcome(true);
    }
  }, []);

  // Закрыть приветствие и сохранить в localStorage
  const handleCloseWelcome = () => {
    setShowWelcome(false);
    if (!hasSeenWelcome) {
      localStorage.setItem("spline_welcome_seen", "true");
      setHasSeenWelcome(true);
    }
  };

  // Показать приветствие снова (для кнопки "보기снова")
  const handleReplayWelcome = () => {
    setShowWelcome(true);
  };

  // Если Spline не установлен, показываем сообщение
  if (!Spline) {
    return (
      <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
        <p>Аро декорация недоступна. Установите пакет:</p>
        <code>npm install @splinetool/react-spline</code>
      </Box>
    );
  }

  return (
    <>
      {/* Диалог приветствия */}
      <Dialog
        open={showWelcome}
        onClose={handleCloseWelcome}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            height: "600px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          {/* Спайн сцена */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: "8px 8px 0 0",
            }}
          >
            <Spline scene={sceneUrl} />
          </Box>

          {/* Кнопка закрытия */}
          <IconButton
            onClick={handleCloseWelcome}
            aria-label="Закрыть приветствие"
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
              background: "rgba(255, 255, 255, 0.9)",
              "&:hover": {
                background: "rgba(255, 255, 255, 1)",
              },
              zIndex: 10,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Действия */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            gap: 1,
            justifyContent: "space-between",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            startIcon={<ReplayIcon />}
            variant="outlined"
            onClick={() => {
              handleCloseWelcome();
              // Очистить localStorage для повторного показа
              setTimeout(() => {
                localStorage.removeItem("spline_welcome_seen");
                setHasSeenWelcome(false);
              }, 300);
            }}
          >
            Показать снова
          </Button>
          <Button variant="contained" onClick={handleCloseWelcome}>
            Начать использование
          </Button>
        </Box>
      </Dialog>

      {/* Кнопка для манипулятивного показа приветствия */}
      {hasSeenWelcome && (
        <Box
          sx={{
            position: "fixed",
            bottom: 16,
            left: 16,
            zIndex: 50,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<ReplayIcon />}
            onClick={handleReplayWelcome}
            sx={{
              borderRadius: "20px",
              textTransform: "none",
            }}
          >
            Показать приветствие
          </Button>
        </Box>
      )}
    </>
  );
};

export default SplineWelcome;
