import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CropFreeIcon from "@mui/icons-material/CropFree";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PlaylistPlayIcon from "@mui/icons-material/PlaylistPlay";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import TableChartIcon from "@mui/icons-material/TableChart";
import TitleIcon from "@mui/icons-material/Title";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HealthStatusChip from "../components/HealthStatusChip";
import ProfileBulkOperations from "../components/ProfileBulkOperations";
import ProfileComparison from "../components/ProfileComparison";
import ProfileEditor from "../components/ProfileEditor";
import ProfileHistory from "../components/ProfileHistory";
import ProfileImportExport from "../components/ProfileImportExport";
import ProfileStatistics from "../components/ProfileStatistics";
import ProfileValidation from "../components/ProfileValidation";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal ? "" : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

/**
 * Profile font settings interface
 */
interface FontSettings {
  name: string;
  size: number;
  color: string;
}

/**
 * Profile margins interface
 */
interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Heading settings interface for specific level (h1, h2)
 */
interface HeadingSettings {
  font_size: number;
  alignment: string;
  space_after?: number;
  first_line_indent?: number;
}

/**
 * Bibliography settings interface
 */
interface BibliographySettings {
  style: string;
  font_size?: number;
  sort_order: string;
  min_sources?: number;
  max_age_years?: number;
}

/**
 * Profile rules interface with all formatting requirements
 */
interface ProfileRules {
  font: FontSettings;
  margins: Margins;
  line_spacing: number;
  first_line_indent: number;
  paragraph_alignment: string;
  headings: {
    h1: HeadingSettings;
    h2: HeadingSettings;
  };
  tables: {
    font_size: number;
    line_spacing: number;
  };
  captions: {
    font_size: number;
    separator: string;
    alignment: string;
  };
  lists: {
    font_size: number;
    left_indent: number;
  };
  footnotes: {
    font_size: number;
    line_spacing: number;
  };
  bibliography?: BibliographySettings;
  required_sections: string[];
}

/**
 * Profile list item interface (minimal data)
 */
interface Profile {
  id: string;
  name: string;
  description?: string;
  category: "gost" | "university" | "custom";
  university?: string;
  version?: string;
  is_system?: boolean;
}

/**
 * Detailed profile data interface
 */
interface ProfileData extends Profile {
  extends?: string;
  rules: ProfileRules;
}

/**
 * Profile form data interface for create/edit operations
 */
interface ProfileFormData {
  name: string;
  description?: string;
  category: "gost" | "university" | "custom";
  university?: string;
  rules?: ProfileRules;
}

/**
 * Import operation result interface
 */
interface ImportResult {
  id: string;
  name: string;
}

/**
 * Category counts interface
 */
interface CategoryCounts {
  all: number;
  gost: number;
  university: number;
  custom: number;
}

/**
 * RuleCard component props interface
 */
interface RuleCardProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  delay: number;
}

/**
 * RuleItem component props interface
 */
interface RuleItemProps {
  label: string;
  value: string | number;
}

/**
 * ProfilesPageProps interface (no props required)
 */
interface ProfilesPageProps {}

/**
 * RuleCard Sub-Component
 *
 * Displays a card with formatting rules in an animated container
 *
 * @param props - RuleCardProps with title, icon, children, and animation delay
 * @returns Card component with animated entrance
 */
const RuleCard: FC<RuleCardProps> = ({ title, icon, children, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ height: "100%" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          height: "100%",
          borderRadius: 1,
          bgcolor: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          transition: "border-color 0.15s ease",
          display: "flex",
          flexDirection: "column",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.18)",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexShrink: 0 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.45)",
              display: "flex",
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1 }}>{children}</Box>
      </Paper>
    </motion.div>
  );
};

/**
 * RuleItem Sub-Component
 *
 * Displays a single rule item with label and value
 *
 * @param props - RuleItemProps with label and value
 * @returns Formatted rule item row
 */
const RuleItem: FC<RuleItemProps> = ({ label, value }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);

/**
 * ProfilesPage Component
 *
 * Manages the display, creation, editing, and deletion of validation profiles.
 * Features include profile list with search/filter, detailed profile view with
 * all formatting rules, comparison, import/export, statistics, and bulk operations.
 *
 * States:
 * - profiles: List of all profiles from API
 * - selectedId: Currently selected profile ID
 * - profileData: Detailed data for selected profile
 * - loading: Initial load state
 * - loadingDetails: Profile details fetch state
 * - error: Error messages
 * - View toggle: Comparison, ImportExport, Statistics, BulkOperations, Editing, Creating
 * - categoryTab: Filter by category (all, gost, university)
 * - searchQuery: Search filter for profiles
 *
 * @returns React component with full profile management interface
 */
const ProfilesPage: FC<ProfilesPageProps> = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Profile data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state - view toggles
  const [categoryTab, setCategoryTab] = useState<"all" | "gost" | "university">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [showImportExport, setShowImportExport] = useState<boolean>(false);
  const [showStatistics, setShowStatistics] = useState<boolean>(false);
  const [showBulkOperations, setShowBulkOperations] = useState<boolean>(false);

  /**
   * Fetch list of all profiles from API
   */
  useEffect(() => {
    fetchProfiles();
  }, []);

  /**
   * Fetch detailed profile data when selection changes
   */
  useEffect(() => {
    if (selectedId && !isCreating) {
      fetchProfileDetails(selectedId);
      setIsEditing(false);
    }
  }, [selectedId]);

  /**
   * Fetch all profiles from API
   */
  const fetchProfiles = async (): Promise<void> => {
    try {
      const res = await axios.get<Profile[]>(`${API_BASE}/api/profiles/`);
      setProfiles(res.data);
      if (res.data.length > 0 && !selectedId) {
        setSelectedId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить список профилей");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch detailed profile data by ID
   *
   * @param id - Profile ID to fetch
   */
  const fetchProfileDetails = async (id: string): Promise<void> => {
    setLoadingDetails(true);
    setError(null);
    try {
      const res = await axios.get<ProfileData>(`${API_BASE}/api/profiles/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить данные профиля");
      setProfileData(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  /**
   * Initialize profile creation mode
   */
  const handleCreateStart = (): void => {
    setIsCreating(true);
    setIsEditing(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setSelectedId(null);
    setProfileData(null);
  };

  /**
   * Initialize profile editing mode
   */
  const handleEditStart = (): void => {
    setIsEditing(true);
    setIsCreating(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
  };

  /**
   * Cancel current operation and return to view mode
   */
  const handleCancel = (): void => {
    setIsCreating(false);
    setIsEditing(false);
    setShowComparison(false);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    if (!selectedId && profiles.length > 0) {
      setSelectedId(profiles[0].id);
    }
  };

  /**
   * Show profile comparison view
   */
  const handleShowComparison = (): void => {
    setShowComparison(true);
    setShowImportExport(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  /**
   * Show import/export view
   */
  const handleShowImportExport = (): void => {
    setShowImportExport(true);
    setShowComparison(false);
    setShowStatistics(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  /**
   * Show statistics view
   */
  const handleShowStatistics = (): void => {
    setShowStatistics(true);
    setShowImportExport(false);
    setShowComparison(false);
    setShowBulkOperations(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  /**
   * Show bulk operations view
   */
  const handleShowBulkOperations = (): void => {
    setShowBulkOperations(true);
    setShowStatistics(false);
    setShowImportExport(false);
    setShowComparison(false);
    setIsEditing(false);
    setIsCreating(false);
  };

  /**
   * Handle successful profile import
   *
   * @param result - Import result with imported profile ID
   */
  const handleImportSuccess = async (result: ImportResult): Promise<void> => {
    await fetchProfiles();
    if (result.id) {
      setSelectedId(result.id);
      setShowImportExport(false);
    }
  };

  /**
   * Save profile (create or update)
   *
   * @param data - Profile data to save
   */
  const handleSave = async (data: ProfileFormData): Promise<void> => {
    try {
      if (isCreating) {
        const res = await axios.post<ProfileData>(`${API_BASE}/api/profiles/`, data);
        await fetchProfiles();
        setSelectedId(res.data.id);
        setIsCreating(false);
      } else if (selectedId) {
        await axios.put(`${API_BASE}/api/profiles/${selectedId}`, data);
        await fetchProfileDetails(selectedId);
        setIsEditing(false);
        // Refresh list to update name/desc if changed
        const res = await axios.get<Profile[]>(`${API_BASE}/api/profiles/`);
        setProfiles(res.data);
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      console.error("Error saving profile:", err);
      alert("Ошибка при сохранении профиля: " + errorMsg);
    }
  };

  /**
   * Duplicate selected profile
   */
  const handleDuplicate = async (): Promise<void> => {
    if (!selectedId) return;
    try {
      const res = await axios.post<ProfileData>(`${API_BASE}/api/profiles/${selectedId}/duplicate`);
      await fetchProfiles();
      setSelectedId(res.data.id);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      console.error("Error duplicating profile:", err);
      alert("Ошибка при дублировании: " + errorMsg);
    }
  };

  /**
   * Open delete confirmation dialog
   */
  const handleDeleteClick = (): void => {
    setDeleteDialogOpen(true);
  };

  /**
   * Confirm and execute profile deletion
   */
  const handleDeleteConfirm = async (): Promise<void> => {
    try {
      if (!selectedId) return;
      await axios.delete(`${API_BASE}/api/profiles/${selectedId}`);
      setDeleteDialogOpen(false);
      const res = await axios.get<Profile[]>(`${API_BASE}/api/profiles/`);
      setProfiles(res.data);
      if (res.data.length > 0) {
        setSelectedId(res.data[0].id);
      } else {
        setSelectedId(null);
        setProfileData(null);
      }
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      console.error("Error deleting profile:", err);
      alert("Ошибка при удалении: " + errorMsg);
      setDeleteDialogOpen(false);
    }
  };

  /**
   * Get category icon by category type
   *
   * @param category - Profile category
   * @returns Icon component for category
   */
  const getCategoryIcon = (category: string): ReactNode => {
    switch (category) {
      case "gost":
        return <VerifiedIcon fontSize="small" />;
      case "university":
        return <SchoolIcon fontSize="small" />;
      default:
        return <DescriptionIcon fontSize="small" />;
    }
  };

  // Calculate filtered profiles list
  const filteredProfiles = profiles.filter((p) => {
    const matchesCategory = categoryTab === "all" || p.category === categoryTab;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Calculate category counts
  const categoryCounts: CategoryCounts = {
    all: profiles.length,
    gost: profiles.filter((p) => p.category === "gost").length,
    university: profiles.filter((p) => p.category === "university").length,
    custom: profiles.filter((p) => p.category === "custom").length,
  };

  // Loading state
  if (loading) {
    return (
      <Box
        sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <Box sx={{ pt: 3, px: 0, zIndex: 10, flexShrink: 0 }}>
        <Container maxWidth="xl">
          <Paper
            className="glass-card"
            elevation={0}
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Back button and title */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={(): void => navigate("/")}
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
                  CURSA / PROFILES
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={500}
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Стандарты оформления
                </Typography>
              </Box>
            </Box>

            {/* Category badges and action buttons */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Chip
                  icon={<VerifiedIcon />}
                  label={`${categoryCounts.gost} ГОСТ`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 600,
                    borderRadius: 0.5,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <Chip
                  icon={<SchoolIcon />}
                  label={`${categoryCounts.university} вузов`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.55)",
                    fontWeight: 600,
                    borderRadius: 0.5,
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </Box>
              <HealthStatusChip />

              {/* Comparison button */}
              <Tooltip title="Сравнить профили">
                <IconButton
                  onClick={(e): void => {
                    e.stopPropagation();
                    handleShowComparison();
                  }}
                  sx={{
                    borderRadius: 1,
                    bgcolor: showComparison ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: showComparison ? "#fff" : "rgba(255,255,255,0.45)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.07)", color: "#fff" },
                  }}
                >
                  <CompareArrowsIcon />
                </IconButton>
              </Tooltip>

              {/* Import/Export button */}
              <Tooltip title="Импорт / Экспорт">
                <IconButton
                  onClick={(e): void => {
                    e.stopPropagation();
                    handleShowImportExport();
                  }}
                  sx={{
                    borderRadius: 1,
                    bgcolor: showImportExport ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: showImportExport ? "#fff" : "rgba(255,255,255,0.45)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.07)", color: "#fff" },
                  }}
                >
                  <FileDownloadIcon />
                </IconButton>
              </Tooltip>

              {/* Statistics button */}
              <Tooltip title="Статистика">
                <IconButton
                  onClick={(e): void => {
                    e.stopPropagation();
                    handleShowStatistics();
                  }}
                  sx={{
                    borderRadius: 1,
                    bgcolor: showStatistics ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: showStatistics ? "#fff" : "rgba(255,255,255,0.45)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.07)", color: "#fff" },
                  }}
                >
                  <BarChartIcon />
                </IconButton>
              </Tooltip>

              {/* Bulk operations button */}
              <Tooltip title="Массовые операции">
                <IconButton
                  onClick={(e): void => {
                    e.stopPropagation();
                    handleShowBulkOperations();
                  }}
                  sx={{
                    borderRadius: 1,
                    bgcolor: showBulkOperations ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: showBulkOperations ? "#fff" : "rgba(255,255,255,0.45)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.07)", color: "#fff" },
                  }}
                >
                  <PlaylistPlayIcon />
                </IconButton>
              </Tooltip>

              {/* Create profile button */}
              <Button
                id="create-profile-btn"
                data-testid="create-profile-btn"
                variant="contained"
                startIcon={<AddIcon />}
                onClick={(e): void => {
                  e.stopPropagation();
                  handleCreateStart();
                }}
                disabled={isCreating}
                sx={{
                  borderRadius: 1,
                  fontWeight: 700,
                  bgcolor: "#fff",
                  color: "#000",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.85)" },
                }}
              >
                Создать профиль
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Main content */}
      <Container
        maxWidth="xl"
        sx={{ flexGrow: 1, py: 3, overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <Grid container spacing={3} sx={{ flexGrow: 1, height: "100%", overflow: "hidden" }}>
          {/* Sidebar profile list */}
          <Grid size={{ xs: 12, md: 3, lg: 2.5 }} sx={{ height: "100%" }}>
            <Paper
              className="glass-card"
              elevation={0}
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              {/* Category tabs */}
              <Tabs
                value={categoryTab}
                onChange={(e, v): void => setCategoryTab(v as typeof categoryTab)}
                variant="fullWidth"
                sx={{
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  minHeight: 48,
                  "& .MuiTab-root": { minHeight: 48, py: 1, fontSize: "0.875rem", fontWeight: 600 },
                }}
              >
                <Tab
                  value="all"
                  label={
                    <Badge
                      badgeContent={categoryCounts.all}
                      color="primary"
                      max={99}
                      sx={{ "& .MuiBadge-badge": { right: -8, top: 5 } }}
                    >
                      <Box component="span" sx={{ px: 1.5 }}>
                        Все
                      </Box>
                    </Badge>
                  }
                />
                <Tab value="gost" label="ГОСТ" />
                <Tab value="university" label="Вузы" />
              </Tabs>

              {/* Search field */}
              <Box sx={{ p: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Поиск профилей..."
                  value={searchQuery}
                  onChange={(e): void => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.common.white, 0.05),
                      "& fieldset": { border: "none" },
                      "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.08) },
                      "&.Mui-focused": { bgcolor: alpha(theme.palette.common.white, 0.1) },
                    },
                  }}
                />
              </Box>

              {/* Profiles list */}
              <List sx={{ p: 1.5, flexGrow: 1, overflow: "auto" }}>
                {filteredProfiles.map((profile, idx) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <ListItemButton
                      selected={selectedId === profile.id && !isCreating}
                      onClick={(): void => {
                        setSelectedId(profile.id);
                        setIsCreating(false);
                      }}
                      sx={{
                        borderRadius: 1,
                        mb: 0.5,
                        py: 1,
                        transition: "all 0.15s",
                        "&.Mui-selected": {
                          bgcolor: "rgba(255,255,255,0.08)",
                          color: "#fff",
                          border: "1px solid rgba(255,255,255,0.15)",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                        },
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.04)",
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 32,
                          color:
                            selectedId === profile.id && !isCreating
                              ? "rgba(255,255,255,0.8)"
                              : "rgba(255,255,255,0.3)",
                        }}
                      >
                        {getCategoryIcon(profile.category)}
                      </ListItemIcon>
                      <ListItemText
                        primary={profile.name}
                        secondary={profile.university || profile.version}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                        secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                      />
                      {profile.is_system && (
                        <Tooltip title="Системный профиль">
                          <VerifiedIcon
                            fontSize="small"
                            sx={{ color: "rgba(255,255,255,0.4)", ml: 0.5 }}
                          />
                        </Tooltip>
                      )}
                    </ListItemButton>
                  </motion.div>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Main content area with conditional rendering */}
          <Grid size={{ xs: 12, md: 9, lg: 9.5 }} sx={{ height: "100%" }}>
            <AnimatePresence mode="wait">
              {showComparison ? (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: "100%" }}
                >
                  <ProfileComparison
                    profiles={profiles}
                    onClose={(): void => setShowComparison(false)}
                  />
                </motion.div>
              ) : showImportExport ? (
                <motion.div
                  key="import-export"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: "100%" }}
                >
                  <ProfileImportExport
                    profiles={profiles}
                    onImport={handleImportSuccess}
                    onRefresh={fetchProfiles}
                    onClose={(): void => setShowImportExport(false)}
                  />
                </motion.div>
              ) : showStatistics ? (
                <motion.div
                  key="statistics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: "100%" }}
                >
                  <ProfileStatistics
                    profiles={profiles}
                    onClose={(): void => setShowStatistics(false)}
                  />
                </motion.div>
              ) : showBulkOperations ? (
                <motion.div
                  key="bulk-operations"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: "100%" }}
                >
                  <ProfileBulkOperations
                    profiles={profiles}
                    onClose={(): void => setShowBulkOperations(false)}
                    onRefresh={fetchProfiles}
                  />
                </motion.div>
              ) : isCreating || isEditing ? (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  style={{ height: "100%" }}
                >
                  <ProfileEditor
                    initialData={isEditing ? profileData : null}
                    onSave={handleSave}
                    onCancel={handleCancel}
                  />
                </motion.div>
              ) : loadingDetails || !profileData ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  {loadingDetails ? (
                    <CircularProgress size={32} />
                  ) : error ? (
                    <>
                      <Typography color="error" variant="h6">
                        {error}
                      </Typography>
                      <Button
                        variant="outlined"
                        onClick={(): Promise<void> => fetchProfileDetails(selectedId!)}
                      >
                        Повторить
                      </Button>
                    </>
                  ) : (
                    <Typography color="text.secondary">Выберите профиль</Typography>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={selectedId}
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  style={{ height: "100%", overflowY: "auto", paddingRight: 8 }}
                >
                  {/* Profile detail view */}
                  <Box
                    sx={{
                      mb: 4,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      <Typography variant="h4" fontWeight={800} gutterBottom>
                        {profileData.name}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        {profileData.description}
                      </Typography>
                      {profileData.extends && (
                        <Chip
                          size="small"
                          label={`Наследует: ${profileData.extends}`}
                          sx={{ mt: 1 }}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title="Дублировать">
                        <IconButton onClick={handleDuplicate}>
                          <ContentCopyIcon />
                        </IconButton>
                      </Tooltip>
                      {!profileData.is_system && (
                        <>
                          <Tooltip title="Редактировать">
                            <IconButton onClick={handleEditStart} color="primary">
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton onClick={handleDeleteClick} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Profile validation section */}
                  <Box sx={{ mb: 3 }}>
                    <ProfileValidation profileId={selectedId!} profileName={profileData.name} />
                  </Box>

                  {/* Profile history section */}
                  <Box sx={{ mb: 3 }}>
                    <ProfileHistory
                      profileId={selectedId!}
                      profileName={profileData.name}
                      isSystemProfile={profileData.is_system || false}
                      onRestore={(): Promise<void> => fetchProfileDetails(selectedId!)}
                    />
                  </Box>

                  {/* Profile rules grid */}
                  <Grid container spacing={3}>
                    {/* Font and text rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Шрифт и текст" icon={<FormatSizeIcon />} delay={0.1}>
                        <RuleItem label="Гарнитура" value={profileData.rules.font.name} />
                        <RuleItem label="Размер" value={`${profileData.rules.font.size} пт`} />
                        <RuleItem
                          label="Цвет"
                          value={
                            profileData.rules.font.color === "000000"
                              ? "Черный"
                              : profileData.rules.font.color
                          }
                        />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem
                          label="Межстрочный"
                          value={`${profileData.rules.line_spacing}x`}
                        />
                        <RuleItem
                          label="Отступ первой строки"
                          value={`${profileData.rules.first_line_indent} см`}
                        />
                        <RuleItem
                          label="Выравнивание"
                          value={
                            profileData.rules.paragraph_alignment === "JUSTIFY"
                              ? "По ширине"
                              : profileData.rules.paragraph_alignment
                          }
                        />
                      </RuleCard>
                    </Grid>

                    {/* Page margins rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Поля страницы" icon={<CropFreeIcon />} delay={0.2}>
                        <RuleItem label="Левое" value={`${profileData.rules.margins.left} см`} />
                        <RuleItem label="Правое" value={`${profileData.rules.margins.right} см`} />
                        <RuleItem label="Верхнее" value={`${profileData.rules.margins.top} см`} />
                        <RuleItem label="Нижнее" value={`${profileData.rules.margins.bottom} см`} />
                      </RuleCard>
                    </Grid>

                    {/* Headings rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Заголовки" icon={<TitleIcon />} delay={0.3}>
                        <Typography variant="caption" color="primary" fontWeight={600}>
                          УРОВЕНЬ 1
                        </Typography>
                        <RuleItem
                          label="Размер"
                          value={`${profileData.rules.headings.h1.font_size} пт`}
                        />
                        <RuleItem
                          label="Выравнивание"
                          value={profileData.rules.headings.h1.alignment}
                        />
                        <RuleItem
                          label="Интервал после"
                          value={`${profileData.rules.headings.h1.space_after || 0} пт`}
                        />

                        <Divider sx={{ my: 1 }} />

                        <Typography variant="caption" color="primary" fontWeight={600}>
                          УРОВЕНЬ 2
                        </Typography>
                        <RuleItem
                          label="Размер"
                          value={`${profileData.rules.headings.h2.font_size} пт`}
                        />
                        <RuleItem
                          label="Отступ"
                          value={`${profileData.rules.headings.h2.first_line_indent || 0} см`}
                        />
                      </RuleCard>
                    </Grid>

                    {/* Tables and captions rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Таблицы и подписи" icon={<TableChartIcon />} delay={0.4}>
                        <RuleItem
                          label="Шрифт таблиц"
                          value={`${profileData.rules.tables.font_size} пт`}
                        />
                        <RuleItem
                          label="Интервал таблиц"
                          value={`${profileData.rules.tables.line_spacing}x`}
                        />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem
                          label="Шрифт подписей"
                          value={`${profileData.rules.captions.font_size} пт`}
                        />
                        <RuleItem
                          label="Разделитель"
                          value={`"${profileData.rules.captions.separator}"`}
                        />
                        <RuleItem
                          label="Выравнивание"
                          value={profileData.rules.captions.alignment}
                        />
                      </RuleCard>
                    </Grid>

                    {/* Lists and footnotes rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard
                        title="Списки и сноски"
                        icon={<FormatListBulletedIcon />}
                        delay={0.5}
                      >
                        <RuleItem
                          label="Шрифт списков"
                          value={`${profileData.rules.lists.font_size} пт`}
                        />
                        <RuleItem
                          label="Отступ слева"
                          value={`${profileData.rules.lists.left_indent} см`}
                        />
                        <Divider sx={{ my: 1 }} />
                        <RuleItem
                          label="Шрифт сносок"
                          value={`${profileData.rules.footnotes.font_size} пт`}
                        />
                        <RuleItem
                          label="Интервал сносок"
                          value={`${profileData.rules.footnotes.line_spacing}x`}
                        />
                      </RuleCard>
                    </Grid>

                    {/* Bibliography rules */}
                    {profileData.rules.bibliography && (
                      <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                        <RuleCard title="Библиография" icon={<MenuBookIcon />} delay={0.55}>
                          <RuleItem
                            label="Стиль"
                            value={
                              profileData.rules.bibliography.style === "gost"
                                ? "ГОСТ"
                                : profileData.rules.bibliography.style
                            }
                          />
                          <RuleItem
                            label="Размер шрифта"
                            value={`${profileData.rules.bibliography.font_size || 14} пт`}
                          />
                          <RuleItem
                            label="Сортировка"
                            value={
                              profileData.rules.bibliography.sort_order === "alphabetical"
                                ? "По алфавиту"
                                : profileData.rules.bibliography.sort_order
                            }
                          />
                          <Divider sx={{ my: 1 }} />
                          <RuleItem
                            label="Мин. источников"
                            value={profileData.rules.bibliography.min_sources || 15}
                          />
                          <RuleItem
                            label="Макс. возраст"
                            value={`${profileData.rules.bibliography.max_age_years || 5} лет`}
                          />
                        </RuleCard>
                      </Grid>
                    )}

                    {/* Required sections rules */}
                    <Grid size={{ xs: 12, md: 6, lg: 4 }}>
                      <RuleCard title="Структура" icon={<MenuBookIcon />} delay={0.6}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Обязательные разделы:
                        </Typography>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {profileData.rules.required_sections.map((sec, idx) => (
                            <Chip
                              key={idx}
                              label={sec}
                              size="small"
                              sx={{
                                bgcolor: "rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.55)",
                                borderRadius: 0.5,
                                border: "1px solid rgba(255,255,255,0.1)",
                              }}
                            />
                          ))}
                        </Box>
                      </RuleCard>
                    </Grid>
                  </Grid>
                </motion.div>
              )}
            </AnimatePresence>
          </Grid>
        </Grid>
      </Container>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onClose={(): void => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить профиль?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите удалить профиль "{profileData?.name}"? Это действие нельзя
            отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilesPage;
