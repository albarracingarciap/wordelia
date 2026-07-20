"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, AlertTriangle } from "lucide-react";
import type { SectionSpec, SectionField, SimpleField } from "./guide-form-schema";

const inputCls =
    "w-full bg-background border border-input rounded-md text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal";

function Label({ children }: { children: React.ReactNode }) {
    return <span className="text-sm font-medium text-foreground">{children}</span>;
}

// --- Lista de strings ------------------------------------------------------

function StringListField({
    value,
    onChange,
    itemLabel = "Elemento",
}: {
    value: string[];
    onChange: (v: string[]) => void;
    itemLabel?: string;
}) {
    const list = Array.isArray(value) ? value : [];
    return (
        <div className="space-y-2">
            {list.map((item, i) => (
                <div key={i} className="flex gap-2 items-start">
                    <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-2 shrink-0" />
                    <textarea
                        value={item ?? ""}
                        onChange={(e) => {
                            const next = [...list];
                            next[i] = e.target.value;
                            onChange(next);
                        }}
                        rows={2}
                        className={`${inputCls} resize-y`}
                    />
                    <button
                        type="button"
                        onClick={() => onChange(list.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-coral mt-1.5 shrink-0"
                        aria-label="Quitar"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...list, ""])}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-dark hover:underline"
            >
                <Plus className="w-3.5 h-3.5" /> Añadir {itemLabel.toLowerCase()}
            </button>
        </div>
    );
}

// --- Campo simple (text / textarea / stringList) ---------------------------

function SimpleFieldEditor({
    field,
    value,
    onChange,
}: {
    field: SimpleField;
    value: any;
    onChange: (v: any) => void;
}) {
    return (
        <label className="block space-y-1">
            <Label>{field.label}</Label>
            {field.type === "text" && (
                <input
                    className={inputCls}
                    value={value ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {field.type === "textarea" && (
                <textarea
                    className={`${inputCls} min-h-[80px] resize-y`}
                    value={value ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
            {field.type === "number" && (
                <input
                    type="number"
                    className={inputCls}
                    value={value ?? ""}
                    placeholder={field.placeholder}
                    onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
                />
            )}
            {field.type === "stringList" && (
                <StringListField value={value} onChange={onChange} />
            )}
        </label>
    );
}

// --- Grupo (sub-objeto de campos fijos) ------------------------------------

function GroupField({
    fields,
    value,
    onChange,
}: {
    fields: SimpleField[];
    value: any;
    onChange: (v: any) => void;
}) {
    const obj = value && typeof value === "object" ? value : {};
    return (
        <div className="rounded-lg border border-teal/10 bg-muted/20 p-3 space-y-3">
            {fields.map((f) => (
                <SimpleFieldEditor
                    key={f.key}
                    field={f}
                    value={obj[f.key]}
                    onChange={(v) => onChange({ ...obj, [f.key]: v })}
                />
            ))}
        </div>
    );
}

// --- Lista de objetos ------------------------------------------------------

function ObjectListField({
    itemFields,
    itemLabel,
    value,
    onChange,
}: {
    itemFields: SimpleField[];
    itemLabel: string;
    value: any[];
    onChange: (v: any[]) => void;
}) {
    const list = Array.isArray(value) ? value : [];
    const emptyItem = () => Object.fromEntries(itemFields.map((f) => [f.key, f.type === "stringList" ? [] : ""]));

    return (
        <div className="space-y-3">
            {list.map((item, i) => (
                <div key={i} className="rounded-lg border border-teal/15 bg-card p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {itemLabel} {i + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() => onChange(list.filter((_, j) => j !== i))}
                            className="inline-flex items-center gap-1 text-xs text-coral hover:underline"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Quitar
                        </button>
                    </div>
                    {itemFields.map((f) => (
                        <SimpleFieldEditor
                            key={f.key}
                            field={f}
                            value={(item ?? {})[f.key]}
                            onChange={(v) => {
                                const next = [...list];
                                next[i] = { ...(item ?? {}), [f.key]: v };
                                onChange(next);
                            }}
                        />
                    ))}
                </div>
            ))}
            <button
                type="button"
                onClick={() => onChange([...list, emptyItem()])}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-dark hover:underline"
            >
                <Plus className="w-4 h-4" /> Añadir {itemLabel.toLowerCase()}
            </button>
        </div>
    );
}

// --- Editor JSON crudo (escotilla para secciones variantes) ----------------

export function RawJsonField({ value, onChange }: { value: any; onChange: (v: any) => void }) {
    const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="space-y-2">
            <textarea
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    try {
                        const parsed = e.target.value.trim() ? JSON.parse(e.target.value) : null;
                        setError(null);
                        onChange(parsed);
                    } catch {
                        setError("JSON inválido — los cambios no se guardarán hasta corregirlo.");
                    }
                }}
                rows={16}
                className={`${inputCls} font-mono text-xs resize-y`}
            />
            {error && (
                <p className="text-xs text-coral flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </p>
            )}
        </div>
    );
}

// --- Dispatcher por sección ------------------------------------------------

export function SectionEditor({
    spec,
    value,
    onChange,
}: {
    spec: SectionSpec;
    value: any;
    onChange: (v: any) => void;
}) {
    if (spec.kind === "object") {
        const obj = value && typeof value === "object" ? value : {};
        return (
            <div className="space-y-4">
                {spec.fields.map((field: SectionField) =>
                    field.type === "group" ? (
                        <div key={field.key} className="space-y-1">
                            <Label>{field.label}</Label>
                            <GroupField
                                fields={field.fields}
                                value={obj[field.key]}
                                onChange={(v) => onChange({ ...obj, [field.key]: v })}
                            />
                        </div>
                    ) : (
                        <SimpleFieldEditor
                            key={field.key}
                            field={field}
                            value={obj[field.key]}
                            onChange={(v) => onChange({ ...obj, [field.key]: v })}
                        />
                    ),
                )}
            </div>
        );
    }

    if (spec.kind === "objectList") {
        return (
            <ObjectListField itemFields={spec.itemFields} itemLabel={spec.itemLabel} value={value} onChange={onChange} />
        );
    }

    if (spec.kind === "stringList") {
        return <StringListField value={value} onChange={onChange} itemLabel={spec.itemLabel} />;
    }

    // raw
    return (
        <div className="space-y-2">
            {spec.note && <p className="text-xs text-muted-foreground">{spec.note} Se edita como JSON.</p>}
            <RawJsonField value={value} onChange={onChange} />
        </div>
    );
}
