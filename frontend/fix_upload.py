import re

with open('src/pages/UploadPage.js', 'r', encoding='utf-8') as f:
    text = f.read()

# We want to replace the <motion.div> block inside the <Stack>
search_pattern = r'(\s*)<motion\.div\s+initial=\{\{.*?</motion\.div>'

replacement = r'''\1<motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }}
            style={{ width: "100%", position: "relative" }}
          >
            <Box
              {...getRootProps()}
              sx={{
                p: { xs: 4, md: 6 },
                minHeight: 180,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
                borderRadius: "32px",
                background: isDragActive 
                  ? "linear-gradient(180deg, rgba(60, 60, 60, 1) 0%, rgba(45, 45, 45, 1) 100%)"
                  : "linear-gradient(180deg, rgba(50, 50, 50, 1) 0%, rgba(35, 35, 35, 1) 100%)",
                boxShadow: "inset 0px 1px 1px rgba(255, 255, 255, 0.2), 0 10px 40px rgba(0,0,0,0.5)",
                border: "1px solid rgba(0,0,0,0.8)",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: "inherit",
                  padding: "1px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none"
                }
              }}
            >
              <input {...getInputProps()} />

              {!status || status === "idle" ? (
                <Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1, pointerEvents: "none" }}>
                  <motion.div
                    animate={{ scale: isDragActive ? 1.1 : 1, y: isDragActive ? -5 : 0 }}
                    transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: alpha(theme.palette.common.white, 0.9) }} />
                  </motion.div>

                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: theme.palette.common.white,
                        fontSize: { xs: "1.5rem", md: "1.8rem" },
                        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                        mb: 0.5,
                      }}
                    >
                      {isDragActive ? "Отпускайте" : "Загрузить документ"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: alpha(theme.palette.common.white, 0.5),
                        fontWeight: 500,
                        fontSize: "0.85rem"
                      }}
                    >
                      Перетащите файл или нажмите для выбора
                    </Typography>
                  </Box>
                </Stack>
              ) : status === "loading" ? (
                <Box sx={{ width: "100%", maxWidth: 320, zIndex: 2, textAlign: "center" }}>
                  <CircularProgress size={40} thickness={3} sx={{ mb: 3, color: "white" }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ letterSpacing: "0.05em", textTransform: "uppercase", mb: 1 }}>
                    Анализируем
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.1)",
                      "& .MuiLinearProgress-bar": {
                        background: "white",
                        boxShadow: "0 0 10px rgba(255,255,255,0.5)",
                      }
                    }}
                  />
                </Box>
              ) : null}
            </Box>

            {/* Profile Selector under the pill */}
            {(!status || status === "idle") && profiles.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <Select
                    value={selectedProfile}
                    onChange={(e) => setSelectedProfile(e.target.value)}
                    displayEmpty
                    sx={{
                      borderRadius: "16px",
                      bgcolor: "transparent",
                      color: alpha(theme.palette.common.white, 0.6),
                      fontSize: "0.85rem",
                      "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                      "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.05) },
                      "& .MuiSelect-icon": { color: alpha(theme.palette.common.white, 0.4) },
                    }}
                  >
                    {profiles.map((p) => (
                      <MenuItem key={p.id} value={p.id} sx={{ fontSize: "0.85rem" }}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
          </motion.div>'''

text_new = re.sub(search_pattern, replacement, text, flags=re.DOTALL)

with open('src/pages/UploadPage.js', 'w', encoding='utf-8') as f:
    f.write(text_new)

print("Done replacement")
