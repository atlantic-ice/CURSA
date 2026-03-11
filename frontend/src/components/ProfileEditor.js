import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  LayoutTemplate,
  ListTree,
  Ruler,
  Save,
  Settings2,
  Table2,
  Type,
  X,
} from "lucide-react";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";

import { cn } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

const baseRules = {
  font: { name: "Times New Roman", size: 14, color: "000000" },
  margins: { left: 3, right: 1.5, top: 2, bottom: 2 },
  line_spacing: 1.5,
  first_line_indent: 1.25,
  paragraph_alignment: "JUSTIFY",
  headings: {
    h1: {
      font_size: 14,
      bold: true,
      alignment: "CENTER",
      all_caps: true,
      space_before: 0,
      space_after: 12,
      first_line_indent: 0,
    },
    h2: {
      font_size: 14,
      bold: true,
      alignment: "LEFT",
      all_caps: false,
      space_before: 12,
      space_after: 12,
      first_line_indent: 1.25,
    },
    h3: {
      font_size: 14,
      bold: true,
      alignment: "LEFT",
      all_caps: false,
      space_before: 12,
      space_after: 0,
      first_line_indent: 1.25,
    },
  },
  tables: {
    font_size: 12,
    alignment: "LEFT",
    line_spacing: 1,
    borders: true,
  },
  captions: {
    font_size: 12,
    alignment: "CENTER",
    separator: " – ",
  },
  lists: {
    font_size: 14,
    line_spacing: 1.5,
    alignment: "JUSTIFY",
    left_indent: 1.25,
  },
  footnotes: { font_size: 10, line_spacing: 1, alignment: "JUSTIFY" },
  bibliography: {
    style: "gost",
    min_sources: 15,
    max_age_years: 5,
    require_foreign: false,
    foreign_min_percent: 0,
  },
  required_sections: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const deepMerge = (base, override) => {
  const output = { ...base };
  Object.entries(override || {}).forEach(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = deepMerge(base?.[key] || {}, value);
    } else {
      output[key] = value;
    }
  });
  return output;
};

const makeTemplate = (id, name, description, overrides) => ({
  id,
  name,
  description,
  rules: deepMerge(baseRules, overrides),
});

const TEMPLATES = [
  makeTemplate("minimal", "Минимальный", "Базовые правила оформления без лишних ограничений.", {}),
  makeTemplate("coursework", "Курсовая работа", "Стандартные требования для курсовых.", {
    required_sections: ["введение", "заключение", "список литературы"],
    bibliography: { min_sources: 15, max_age_years: 5 },
  }),
  makeTemplate("thesis", "ВКР / Диплом", "Расширенные требования для выпускных работ.", {
    required_sections: ["содержание", "введение", "заключение", "список литературы", "приложение"],
    bibliography: {
      min_sources: 25,
      max_age_years: 5,
      require_foreign: true,
      foreign_min_percent: 10,
    },
  }),
  makeTemplate("article", "Научная статья", "Компактный формат для журналов и публикаций.", {
    font: { size: 12 },
    margins: { left: 2.5, right: 2.5, top: 2.5, bottom: 2.5 },
    line_spacing: 1,
    first_line_indent: 1,
    tables: { font_size: 10 },
    captions: { font_size: 10, separator: ". " },
    bibliography: { min_sources: 10, require_foreign: true, foreign_min_percent: 20 },
    required_sections: [
      "аннотация",
      "ключевые слова",
      "введение",
      "заключение",
      "список литературы",
    ],
  }),
];

const STEPS = [
  { id: 0, label: "Шаблон", icon: <LayoutTemplate className="h-4 w-4" /> },
  { id: 1, label: "Основные", icon: <Settings2 className="h-4 w-4" /> },
  { id: 2, label: "Шрифт", icon: <Type className="h-4 w-4" /> },
  { id: 3, label: "Поля", icon: <Ruler className="h-4 w-4" /> },
  { id: 4, label: "Заголовки", icon: <ListTree className="h-4 w-4" /> },
  { id: 5, label: "Элементы", icon: <Table2 className="h-4 w-4" /> },
  { id: 6, label: "Библиография", icon: <BookOpenText className="h-4 w-4" /> },
  { id: 7, label: "Структура", icon: <FileText className="h-4 w-4" /> },
];

const normalizeInitialData = (initialData) => {
  if (!initialData) return null;
  const normalized = clone(initialData);
  normalized.rules = deepMerge(baseRules, normalized.rules || {});
  if (normalized.university && typeof normalized.university === "object") {
    normalized.university = normalized.university.short_name || normalized.university.name || "";
  }
  if (!Array.isArray(normalized.rules.required_sections)) {
    normalized.rules.required_sections = [];
  }
  return normalized;
};

const Field = ({ label, children, hint }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
    {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
  </div>
);

const SwitchField = ({ label, checked, onCheckedChange, hint }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
    <div>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const TemplatePreview = ({ template, active, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    className={cn(
      "w-full rounded-[1.5rem] border p-4 text-left transition-colors",
      active ? "border-primary/40 bg-accent" : "border-border/70 bg-background hover:bg-accent/40",
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-foreground">{template.name}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{template.description}</p>
      </div>
      {active ? <CheckCircle2 className="h-5 w-5 text-primary" /> : null}
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      <Badge variant="outline" className="rounded-full">
        {template.rules.font.name}
      </Badge>
      <Badge variant="outline" className="rounded-full">
        {template.rules.font.size} пт
      </Badge>
      <Badge variant="outline" className="rounded-full">
        {template.rules.line_spacing}x
      </Badge>
    </div>
  </button>
);

const DocumentPreview = ({ rules, title }) => {
  const cmToPx = (cm) => cm * 24;
  const pageWidth = 190;
  const pageHeight = pageWidth * 1.414;
  const margins = {
    left: cmToPx(rules?.margins?.left || 3) / 6,
    right: cmToPx(rules?.margins?.right || 1.5) / 6,
    top: cmToPx(rules?.margins?.top || 2) / 6,
    bottom: cmToPx(rules?.margins?.bottom || 2) / 6,
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">Предпросмотр</p>
        <p className="text-xs text-muted-foreground">
          Сводный макет документа по текущим правилам.
        </p>
      </div>
      <div className="rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
        <div
          className="relative mx-auto overflow-hidden rounded-md bg-white shadow-lg"
          style={{ width: pageWidth, height: pageHeight }}
        >
          <div
            className="absolute border border-dashed border-slate-400/60"
            style={{
              left: margins.left,
              right: margins.right,
              top: margins.top,
              bottom: margins.bottom,
            }}
          />
          <div
            className="absolute text-black"
            style={{
              left: margins.left + 6,
              right: margins.right + 6,
              top: margins.top + 8,
              fontFamily: rules?.font?.name || "serif",
            }}
          >
            <p
              style={{
                fontSize: 7,
                fontWeight: 700,
                textAlign: rules?.headings?.h1?.alignment === "CENTER" ? "center" : "left",
                textTransform: rules?.headings?.h1?.all_caps ? "uppercase" : "none",
                margin: 0,
              }}
            >
              {title || "Название профиля"}
            </p>
            <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
              <div style={{ height: 3, background: "#d4d4d8", width: "100%" }} />
              <div
                style={{
                  height: 3,
                  background: "#d4d4d8",
                  width: "94%",
                  marginLeft: `${(rules?.first_line_indent || 1.25) * 4}px`,
                }}
              />
              <div style={{ height: 3, background: "#d4d4d8", width: "100%" }} />
              <div
                style={{
                  height: 3,
                  background: "#d4d4d8",
                  width: "88%",
                  marginLeft: `${(rules?.first_line_indent || 1.25) * 4}px`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-full">
          {rules?.font?.name?.split(" ")[0] || "Шрифт"}
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {rules?.font?.size || 14} пт
        </Badge>
        <Badge variant="outline" className="rounded-full">
          {rules?.line_spacing || 1.5}x
        </Badge>
      </div>
    </div>
  );
};

export default function ProfileEditor({ initialData, onSave, onCancel }) {
  const normalizedInitialData = useMemo(() => normalizeInitialData(initialData), [initialData]);
  const isEditing = Boolean(normalizedInitialData);
  const [activeStep, setActiveStep] = useState(normalizedInitialData ? 1 : 0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(
    normalizedInitialData || {
      name: "",
      description: "",
      category: "custom",
      university: "",
      version: "1.0",
      rules: clone(baseRules),
    },
  );
  const [newSection, setNewSection] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const updateField = (path, value) => {
    setFormData((previous) => {
      const next = clone(previous);
      const keys = path.split(".");
      const lastKey = keys.pop();
      let current = next;
      keys.forEach((key) => {
        if (!current[key] || typeof current[key] !== "object") current[key] = {};
        current = current[key];
      });
      current[lastKey] = value;
      return next;
    });
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    setFormData({
      name: "",
      description: "",
      category: "custom",
      university: "",
      version: "1.0",
      rules: clone(template.rules),
    });
    setActiveStep(1);
  };

  const handleSaveClick = async () => {
    if (!formData?.name?.trim()) {
      setError("Название профиля обязательно.");
      setActiveStep(1);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        university: formData.category === "university" ? formData.university?.trim() || "" : "",
      });
    } catch (err) {
      setError(err?.message || "Ошибка сохранения.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSection = () => {
    const section = newSection.trim().toLowerCase();
    if (!section) return;
    if (formData.rules.required_sections.includes(section)) {
      setNewSection("");
      return;
    }
    updateField("rules.required_sections", [...formData.rules.required_sections, section]);
    setNewSection("");
  };

  const handleRemoveSection = (section) => {
    updateField(
      "rules.required_sections",
      formData.rules.required_sections.filter((item) => item !== section),
    );
  };

  const canProceed = () => {
    if (activeStep === 0 && !isEditing) return Boolean(selectedTemplate);
    if (activeStep === 1) return Boolean(formData?.name?.trim());
    return true;
  };

  const renderMainStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold tracking-[-0.03em] text-foreground">
                Выберите шаблон
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Начните с готовой основы и донастройте её под ваш формат оформления.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {TEMPLATES.map((template) => (
                <TemplatePreview
                  key={template.id}
                  template={template}
                  active={selectedTemplate === template.id}
                  onSelect={() => handleSelectTemplate(template)}
                />
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Название профиля" hint="Например: Требования МГТУ">
                <Input
                  value={formData.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="rounded-2xl"
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Описание">
                <textarea
                  value={formData.description || ""}
                  onChange={(event) => updateField("description", event.target.value)}
                  rows={4}
                  className="flex w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </Field>
            </div>
            <Field label="Категория">
              <Select
                value={formData.category}
                onValueChange={(value) => updateField("category", value)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Пользовательский</SelectItem>
                  <SelectItem value="university">Требования ВУЗа</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Версия">
              <Input
                value={formData.version || "1.0"}
                onChange={(event) => updateField("version", event.target.value)}
                className="rounded-2xl"
              />
            </Field>
            {formData.category === "university" ? (
              <div className="md:col-span-2">
                <Field label="Название ВУЗа">
                  <Input
                    value={formData.university || ""}
                    onChange={(event) => updateField("university", event.target.value)}
                    className="rounded-2xl"
                    placeholder="МГУ, МГТУ, СПбГУ..."
                  />
                </Field>
              </div>
            ) : null}
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Гарнитура">
              <Select
                value={formData.rules.font.name}
                onValueChange={(value) => updateField("rules.font.name", value)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Calibri">Calibri</SelectItem>
                  <SelectItem value="PT Serif">PT Serif</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Размер шрифта">
              <Input
                type="number"
                value={formData.rules.font.size}
                onChange={(event) =>
                  updateField("rules.font.size", parseFloat(event.target.value || 0))
                }
                className="rounded-2xl"
              />
            </Field>
            <Field label="Цвет" hint="HEX без #">
              <Input
                value={formData.rules.font.color}
                onChange={(event) => updateField("rules.font.color", event.target.value)}
                className="rounded-2xl"
              />
            </Field>
            <Field label="Межстрочный интервал">
              <Input
                type="number"
                step="0.1"
                value={formData.rules.line_spacing}
                onChange={(event) =>
                  updateField("rules.line_spacing", parseFloat(event.target.value || 0))
                }
                className="rounded-2xl"
              />
            </Field>
            <Field label="Отступ первой строки, см">
              <Input
                type="number"
                step="0.05"
                value={formData.rules.first_line_indent}
                onChange={(event) =>
                  updateField("rules.first_line_indent", parseFloat(event.target.value || 0))
                }
                className="rounded-2xl"
              />
            </Field>
            <Field label="Выравнивание абзаца">
              <Select
                value={formData.rules.paragraph_alignment}
                onValueChange={(value) => updateField("rules.paragraph_alignment", value)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEFT">По левому краю</SelectItem>
                  <SelectItem value="CENTER">По центру</SelectItem>
                  <SelectItem value="JUSTIFY">По ширине</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        );
      case 3:
        return (
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["left", "Левое"],
              ["right", "Правое"],
              ["top", "Верхнее"],
              ["bottom", "Нижнее"],
            ].map(([key, label]) => (
              <Field key={key} label={`${label} поле, см`}>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.rules.margins[key]}
                  onChange={(event) =>
                    updateField(`rules.margins.${key}`, parseFloat(event.target.value || 0))
                  }
                  className="rounded-2xl"
                />
              </Field>
            ))}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            {["h1", "h2", "h3"].map((heading, index) => (
              <Card key={heading} className="rounded-[1.5rem] border-border/70 bg-muted/20">
                <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                  <div className="md:col-span-2 xl:col-span-3">
                    <p className="text-sm font-semibold text-foreground">Заголовок {index + 1}</p>
                  </div>
                  <Field label="Размер, пт">
                    <Input
                      type="number"
                      value={formData.rules.headings[heading].font_size}
                      onChange={(event) =>
                        updateField(
                          `rules.headings.${heading}.font_size`,
                          parseFloat(event.target.value || 0),
                        )
                      }
                      className="rounded-2xl"
                    />
                  </Field>
                  <Field label="Выравнивание">
                    <Select
                      value={formData.rules.headings[heading].alignment}
                      onValueChange={(value) =>
                        updateField(`rules.headings.${heading}.alignment`, value)
                      }
                    >
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEFT">Слева</SelectItem>
                        <SelectItem value="CENTER">По центру</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Отступ первой строки, см">
                    <Input
                      type="number"
                      step="0.05"
                      value={formData.rules.headings[heading].first_line_indent || 0}
                      onChange={(event) =>
                        updateField(
                          `rules.headings.${heading}.first_line_indent`,
                          parseFloat(event.target.value || 0),
                        )
                      }
                      className="rounded-2xl"
                    />
                  </Field>
                  <Field label="Интервал до, пт">
                    <Input
                      type="number"
                      value={formData.rules.headings[heading].space_before || 0}
                      onChange={(event) =>
                        updateField(
                          `rules.headings.${heading}.space_before`,
                          parseFloat(event.target.value || 0),
                        )
                      }
                      className="rounded-2xl"
                    />
                  </Field>
                  <Field label="Интервал после, пт">
                    <Input
                      type="number"
                      value={formData.rules.headings[heading].space_after || 0}
                      onChange={(event) =>
                        updateField(
                          `rules.headings.${heading}.space_after`,
                          parseFloat(event.target.value || 0),
                        )
                      }
                      className="rounded-2xl"
                    />
                  </Field>
                  <div className="space-y-3 md:col-span-2 xl:col-span-3 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0">
                    <SwitchField
                      label="Жирное начертание"
                      checked={Boolean(formData.rules.headings[heading].bold)}
                      onCheckedChange={(checked) =>
                        updateField(`rules.headings.${heading}.bold`, checked)
                      }
                    />
                    {heading === "h1" ? (
                      <SwitchField
                        label="Только прописные"
                        checked={Boolean(formData.rules.headings[heading].all_caps)}
                        onCheckedChange={(checked) =>
                          updateField(`rules.headings.${heading}.all_caps`, checked)
                        }
                      />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div className="md:col-span-3">
                  <p className="text-sm font-semibold text-foreground">Таблицы</p>
                </div>
                <Field label="Размер шрифта, пт">
                  <Input
                    type="number"
                    value={formData.rules.tables.font_size}
                    onChange={(event) =>
                      updateField("rules.tables.font_size", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <Field label="Интервал">
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.rules.tables.line_spacing}
                    onChange={(event) =>
                      updateField("rules.tables.line_spacing", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <SwitchField
                  label="Показывать границы таблиц"
                  checked={Boolean(formData.rules.tables.borders)}
                  onCheckedChange={(checked) => updateField("rules.tables.borders", checked)}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
              <CardContent className="grid gap-4 p-5 md:grid-cols-3">
                <div className="md:col-span-3">
                  <p className="text-sm font-semibold text-foreground">Подписи и списки</p>
                </div>
                <Field label="Шрифт подписи, пт">
                  <Input
                    type="number"
                    value={formData.rules.captions.font_size}
                    onChange={(event) =>
                      updateField("rules.captions.font_size", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <Field label="Разделитель подписи">
                  <Input
                    value={formData.rules.captions.separator}
                    onChange={(event) =>
                      updateField("rules.captions.separator", event.target.value)
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <Field label="Шрифт списков, пт">
                  <Input
                    type="number"
                    value={formData.rules.lists.font_size}
                    onChange={(event) =>
                      updateField("rules.lists.font_size", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <Field label="Отступ списка, см">
                  <Input
                    type="number"
                    step="0.05"
                    value={formData.rules.lists.left_indent}
                    onChange={(event) =>
                      updateField("rules.lists.left_indent", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
                <Field label="Шрифт сносок, пт">
                  <Input
                    type="number"
                    value={formData.rules.footnotes.font_size}
                    onChange={(event) =>
                      updateField("rules.footnotes.font_size", parseFloat(event.target.value || 0))
                    }
                    className="rounded-2xl"
                  />
                </Field>
              </CardContent>
            </Card>
          </div>
        );
      case 6:
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Стиль">
              <Select
                value={formData.rules.bibliography.style}
                onValueChange={(value) => updateField("rules.bibliography.style", value)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gost">ГОСТ Р 7.0.5-2008</SelectItem>
                  <SelectItem value="gost_2018">ГОСТ Р 7.0.100-2018</SelectItem>
                  <SelectItem value="apa">APA</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Минимум источников">
              <Input
                type="number"
                value={formData.rules.bibliography.min_sources}
                onChange={(event) =>
                  updateField(
                    "rules.bibliography.min_sources",
                    parseInt(event.target.value || 0, 10),
                  )
                }
                className="rounded-2xl"
              />
            </Field>
            <Field label="Максимальный возраст, лет">
              <Input
                type="number"
                value={formData.rules.bibliography.max_age_years}
                onChange={(event) =>
                  updateField(
                    "rules.bibliography.max_age_years",
                    parseInt(event.target.value || 0, 10),
                  )
                }
                className="rounded-2xl"
              />
            </Field>
            <div className="md:col-span-2 xl:col-span-3">
              <SwitchField
                label="Требовать иностранные источники"
                checked={Boolean(formData.rules.bibliography.require_foreign)}
                onCheckedChange={(checked) =>
                  updateField("rules.bibliography.require_foreign", checked)
                }
              />
            </div>
            {formData.rules.bibliography.require_foreign ? (
              <Field label="Минимум иностранных, %">
                <Input
                  type="number"
                  value={formData.rules.bibliography.foreign_min_percent}
                  onChange={(event) =>
                    updateField(
                      "rules.bibliography.foreign_min_percent",
                      parseInt(event.target.value || 0, 10),
                    )
                  }
                  className="rounded-2xl"
                />
              </Field>
            ) : null}
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={newSection}
                onChange={(event) => setNewSection(event.target.value)}
                placeholder="Название раздела"
                className="rounded-2xl"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSection();
                  }
                }}
              />
              <Button onClick={handleAddSection} className="rounded-2xl">
                Добавить
              </Button>
            </div>
            <div className="flex min-h-[72px] flex-wrap gap-2 rounded-[1.5rem] border border-border/70 bg-muted/20 p-4">
              {formData.rules.required_sections.length > 0 ? (
                formData.rules.required_sections.map((section) => (
                  <Badge
                    key={section}
                    variant="outline"
                    className="flex items-center gap-2 rounded-full px-3 py-1 capitalize"
                  >
                    {section}
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(section)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm italic text-muted-foreground">Нет обязательных разделов.</p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Быстрое добавление</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "введение",
                  "заключение",
                  "список литературы",
                  "приложение",
                  "содержание",
                  "аннотация",
                ].map((section) => (
                  <Button
                    key={section}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full capitalize"
                    disabled={formData.rules.required_sections.includes(section)}
                    onClick={() =>
                      updateField("rules.required_sections", [
                        ...formData.rules.required_sections,
                        section,
                      ])
                    }
                  >
                    {section}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <CardHeader className="border-b border-border/60 bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">
              {isEditing ? "Редактирование профиля" : "Создание профиля"}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? "Настройте правила выбранного профиля."
                : "Соберите новый профиль оформления на основе шаблона."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {formData?.name ? (
              <Badge variant="outline" className="rounded-full">
                {formData.name}
              </Badge>
            ) : null}
            <Button variant="outline" onClick={() => setShowPreview((previous) => !previous)}>
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "Скрыть preview" : "Показать preview"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4" />
              Отмена
            </Button>
            <Button onClick={handleSaveClick} disabled={saving || !formData?.name?.trim()}>
              <Save className="h-4 w-4" />
              {saving ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        {error ? (
          <div className="rounded-2xl border border-destructive/15 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div
          className={cn(
            "grid gap-5",
            showPreview
              ? "xl:grid-cols-[240px_minmax(0,1fr)_280px]"
              : "xl:grid-cols-[240px_minmax(0,1fr)]",
          )}
        >
          <div className="space-y-2">
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id === 0 && isEditing) return;
                  if (step.id === 0 || formData || isEditing) setActiveStep(step.id);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                  activeStep === step.id
                    ? "border-primary/30 bg-accent text-foreground"
                    : "border-border/70 bg-background hover:bg-accent/40",
                  step.id === 0 && isEditing ? "opacity-50" : "",
                )}
                disabled={step.id === 0 && isEditing}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  {step.icon}
                </span>
                <span className="text-sm font-medium">{step.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-5 rounded-[1.75rem] border border-border/70 bg-background p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {renderMainStep()}
              </motion.div>
            </AnimatePresence>

            <Separator />

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep((previous) => previous - 1)}
                disabled={activeStep === 0}
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
              {activeStep < STEPS.length - 1 ? (
                <Button
                  onClick={() => setActiveStep((previous) => previous + 1)}
                  disabled={!canProceed()}
                >
                  Далее
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSaveClick} disabled={saving || !formData?.name?.trim()}>
                  <Save className="h-4 w-4" />
                  {saving ? "Сохранение..." : "Сохранить"}
                </Button>
              )}
            </div>
          </div>

          {showPreview ? <DocumentPreview rules={formData?.rules} title={formData?.name} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  hint: PropTypes.string,
};

SwitchField.propTypes = {
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onCheckedChange: PropTypes.func.isRequired,
  hint: PropTypes.string,
};

TemplatePreview.propTypes = {
  template: PropTypes.object.isRequired,
  active: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

DocumentPreview.propTypes = {
  rules: PropTypes.object,
  title: PropTypes.string,
};

ProfileEditor.propTypes = {
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
