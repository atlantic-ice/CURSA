import { Box, Chip, Stack, Tooltip, Typography, alpha, useTheme } from "@mui/material";
import { useEffect, useMemo, useState } from "react";

import { healthApi } from "../api/client";

const STATUS_CONFIG = {
  checking: { label: "Проверка", color: "default" },
  healthy: { label: "API онлайн", color: "success" },
  degraded: { label: "API деградация", color: "warning" },
  unhealthy: { label: "API сбой", color: "error" },
  offline: { label: "API офлайн", color: "default" },
};

const HealthStatusChip = () => {
  const theme = useTheme();
  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);

  const formatSize = (value) => {
    if (value === null || value === undefined) return "—";
    return `${value} MB`;
  };

  useEffect(() => {
    let isMounted = true;
    let timerId;

    const fetchHealth = async () => {
      try {
        const response = await healthApi.getDetailed();
        if (!isMounted) return;
        setStatus(response?.status || "healthy");
        setDetails(response || null);
      } catch (error) {
        if (!isMounted) return;
        setStatus("offline");
        setDetails(null);
      }
    };

    fetchHealth();
    timerId = setInterval(fetchHealth, 15000);

    return () => {
      isMounted = false;
      if (timerId) clearInterval(timerId);
    };
  }, []);

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;

  const tooltipContent = useMemo(() => {
    if (!details) return "Сервис недоступен";
    const uptime = details.uptime?.human || "—";
    const version = details.version || "—";
    const components = details.components || {};
    const storageStatus = components.storage?.status || "unknown";
    const profilesStatus = components.profiles?.status || "unknown";
    const logsStatus = components.logs?.status || "unknown";
    const environment = details.environment || "—";
    const cpu = details.system?.cpu_percent;
    const memory = details.system?.memory?.percent_used;
    const storage = details.storage || {};
    const corrections = storage.corrections || {};
    const reports = storage.reports || {};
    const profiles = storage.profiles || {};

    return (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.5 }}>
          Статус: {details.status} • Версия: {version} • Среда: {environment}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
          Uptime: {uptime}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: "wrap" }}>
          <Chip size="small" label={`Storage: ${storageStatus}`} variant="outlined" />
          <Chip size="small" label={`Profiles: ${profilesStatus}`} variant="outlined" />
          <Chip size="small" label={`Logs: ${logsStatus}`} variant="outlined" />
        </Stack>
        <Stack spacing={0.25} sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Corrections: {corrections.count ?? "—"} • {formatSize(corrections.size_mb)}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Reports: {reports.count ?? "—"} • {formatSize(reports.size_mb)}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Profiles: {profiles.count ?? "—"} • {formatSize(profiles.size_mb)}
          </Typography>
        </Stack>
        {(cpu !== undefined || memory !== undefined) && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            CPU: {cpu ?? "—"}% • RAM: {memory ?? "—"}%
          </Typography>
        )}
      </Box>
    );
  }, [details]);

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        size="small"
        label={config.label}
        color={config.color}
        variant="outlined"
        sx={{
          borderRadius: 2,
          fontWeight: 700,
          letterSpacing: "0.02em",
          bgcolor: alpha(theme.palette.common.black, 0.2),
          borderColor: alpha(theme.palette.divider, 0.4),
        }}
      />
    </Tooltip>
  );
};

export default HealthStatusChip;
