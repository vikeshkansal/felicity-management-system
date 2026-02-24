"use client";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { Event, CustomFormField } from "@/lib/definitions";
import api from "@/lib/api";
import type { AxiosError } from "axios";

type ApiErrorResponse = {
    message?: string;
};

type EventUpdatePayload = {
    name?: string;
    description?: string;
    type?: Event["type"];
    eligibility?: string;
    regDeadline?: string;
    regLimit?: number;
    regFee?: number;
    tags?: string[];
    start?: string;
    end?: string;
    itemDetails?: Event["itemDetails"];
    stockQuantity?: number;
    purchaseLimitPerParticipant?: number;
    customForm?: Event["customForm"];
};

export default function EventEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = use(params);
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tagInput, setTagInput] = useState("");
    const [sizeInput, setSizeInput] = useState("");
    const [colorInput, setColorInput] = useState("");
    const [variantInput, setVariantInput] = useState("");

    const fetchEvent = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get(`/events/${eventId}`);
            setEvent(res.data);
        } catch {
            setError("Failed to fetch event");
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchEvent();
    }, [fetchEvent]);

    const updateField = <K extends keyof Event>(field: K, value: Event[K]) => {
        setEvent((previous) => (previous ? { ...previous, [field]: value } : previous));
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && event && !event.tags.includes(trimmed)) updateField("tags", [...event.tags, trimmed]);
        setTagInput("");
    };
    const removeTag = (t: string) => { if (event) updateField("tags", event.tags.filter(x => x !== t)); };
    const addChip = (field: "sizes" | "colors" | "variants", input: string, setInput: (v: string) => void) => {
        if (!event?.itemDetails) return;
        const trimmed = input.trim();
        const list = event.itemDetails[field] || [];
        if (trimmed && !list.includes(trimmed)) {
            updateField("itemDetails", { ...event.itemDetails, [field]: [...list, trimmed] });
        }
        setInput("");
    };
    const removeChip = (field: "sizes" | "colors" | "variants", item: string) => {
        if (!event?.itemDetails) return;
        updateField("itemDetails", { ...event.itemDetails, [field]: (event.itemDetails[field] || []).filter(x => x !== item) });
    };
    const addFormField = () => {
        const form = event?.customForm || [];
        updateField("customForm", [...form, { fieldName: "", fieldType: "text", required: false, options: [], order: form.length }]);
    };
    const updateFormField = (index: number, updates: Partial<CustomFormField>) => {
        const form = [...(event?.customForm || [])];
        form[index] = { ...form[index], ...updates };
        updateField("customForm", form);
    };
    const removeFormField = (index: number) => {
        updateField("customForm", (event?.customForm || []).filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
    };
    const moveFormField = (index: number, direction: -1 | 1) => {
        const form = [...(event?.customForm || [])];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= form.length) return;
        [form[index], form[newIndex]] = [form[newIndex], form[index]];
        updateField("customForm", form.map((f, i) => ({ ...f, order: i })));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;

        try {
            setLoading(true);
            setError("");

            let payload: EventUpdatePayload;

            if (event.status === "draft") {
                payload = {
                    name: event.name,
                    description: event.description,
                    type: event.type,
                    eligibility: event.eligibility,
                    regDeadline: event.regDeadline,
                    regLimit: event.regLimit,
                    regFee: event.regFee,
                    tags: event.tags,
                    start: event.start,
                    end: event.end,
                };

                if (event.type === "merchandise") {
                    payload.itemDetails = event.itemDetails;
                    payload.stockQuantity = event.stockQuantity;
                    payload.purchaseLimitPerParticipant = event.purchaseLimitPerParticipant;
                } else {
                    payload.customForm = event.customForm;
                }
            } else if (event.status === "published") {
                payload = {
                    description: event.description,
                    regDeadline: event.regDeadline,
                    regLimit: event.regLimit,
                };
            } else {
                setError("This event cannot be edited in its current status");
                return;
            }

            await api.put(`/events/${eventId}`, payload);
            router.push(`/organizer/events/${eventId}`);
        } catch (error: unknown) {
            const axiosError = error as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || "Failed to update event");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error || "Event not found"}</div>
            </div>
        );
    }

    const isDraft = event.status === "draft";
    const isPublished = event.status === "published";
    const isLocked = !isDraft && !isPublished;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {error && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
            )}
            {isPublished && (
                <div className="p-3 mb-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
                    This event is <strong>published</strong>. Only description, registration deadline, and registration limit can be edited. Type-specific fields are locked.
                </div>
            )}
            {isLocked && (
                <div className="p-3 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
                    This event is <strong>{event.status}</strong>. No fields can be edited. Use the event detail page to change status.
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Edit Event: {event.name}</CardTitle>
                    <CardDescription>Status: <Badge variant="secondary">{event.status}</Badge></CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name</Label>
                            <Input id="name" value={event.name} onChange={(e) => updateField("name", e.target.value)} disabled={!isDraft} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={event.description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateField("description", e.target.value)}
                                rows={4} disabled={isLocked} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Event Type</Label>
                                <Input value={event.type} disabled className="bg-gray-100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eligibility">Eligibility</Label>
                                <Input id="eligibility" value={event.eligibility} onChange={(e) => updateField("eligibility", e.target.value)} disabled={!isDraft} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Event Start</Label>
                                <Input id="start" type="datetime-local"
                                    value={event.start ? new Date(event.start).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => updateField("start", e.target.value)} disabled={!isDraft} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Event End</Label>
                                <Input id="end" type="datetime-local"
                                    value={event.end ? new Date(event.end).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => updateField("end", e.target.value)} disabled={!isDraft} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="regDeadline">Registration Deadline</Label>
                                <Input id="regDeadline" type="datetime-local"
                                    value={event.regDeadline ? new Date(event.regDeadline).toISOString().slice(0, 16) : ""}
                                    onChange={(e) => updateField("regDeadline", e.target.value)} disabled={isLocked} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="regLimit">Registration Limit</Label>
                                <Input id="regLimit" type="number" min={1} value={event.regLimit}
                                    onChange={(e) => updateField("regLimit", Number(e.target.value))} disabled={isLocked} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="regFee">Registration Fee (₹)</Label>
                                <Input id="regFee" type="number" min={0} value={event.regFee}
                                    onChange={(e) => updateField("regFee", Number(e.target.value))} disabled={!isDraft} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            {isDraft ? (
                                <>
                                    <div className="flex gap-2">
                                        <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Type a tag and press Enter" />
                                        <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                                    </div>
                                    {event.tags && event.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {event.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} ✕</Badge>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {event.tags?.map((tag) => (
                                        <Badge key={tag} variant="outline">{tag}</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        {event.type === "merchandise" && (
                            <Card className="border-orange-200 bg-orange-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Merchandise Details</CardTitle>
                                    {!isDraft && <CardDescription>Locked after draft stage.</CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Sizes</Label>
                                        {isDraft ? (
                                            <>
                                                <div className="flex gap-2">
                                                    <Input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("sizes", sizeInput, setSizeInput); } }}
                                                        placeholder="e.g. S, M, L" />
                                                    <Button type="button" variant="outline" onClick={() => addChip("sizes", sizeInput, setSizeInput)}>Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {(event.itemDetails?.sizes || []).map((s) => (
                                                        <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => removeChip("sizes", s)}>{s} ✕</Badge>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">{(event.itemDetails?.sizes || []).map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Colors</Label>
                                        {isDraft ? (
                                            <>
                                                <div className="flex gap-2">
                                                    <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("colors", colorInput, setColorInput); } }}
                                                        placeholder="e.g. Red, Blue" />
                                                    <Button type="button" variant="outline" onClick={() => addChip("colors", colorInput, setColorInput)}>Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {(event.itemDetails?.colors || []).map((c) => (
                                                        <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => removeChip("colors", c)}>{c} ✕</Badge>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">{(event.itemDetails?.colors || []).map((c) => <Badge key={c} variant="outline">{c}</Badge>)}</div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Variants</Label>
                                        {isDraft ? (
                                            <>
                                                <div className="flex gap-2">
                                                    <Input value={variantInput} onChange={(e) => setVariantInput(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip("variants", variantInput, setVariantInput); } }}
                                                        placeholder="e.g. Limited Edition" />
                                                    <Button type="button" variant="outline" onClick={() => addChip("variants", variantInput, setVariantInput)}>Add</Button>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {(event.itemDetails?.variants || []).map((v) => (
                                                        <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeChip("variants", v)}>{v} ✕</Badge>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">{(event.itemDetails?.variants || []).map((v) => <Badge key={v} variant="outline">{v}</Badge>)}</div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Stock Quantity</Label>
                                            <Input type="number" min={0} value={event.stockQuantity ?? 0} onChange={(e) => updateField("stockQuantity", Number(e.target.value))} disabled={!isDraft} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Purchase Limit</Label>
                                            <Input type="number" min={1} value={event.purchaseLimitPerParticipant ?? 1} onChange={(e) => updateField("purchaseLimitPerParticipant", Number(e.target.value))} disabled={!isDraft} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {event.type === "normal" && (
                            <Card className="border-blue-200 bg-blue-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Custom Registration Form</CardTitle>
                                    {!isDraft && <CardDescription>Locked after draft stage.</CardDescription>}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(event.customForm || []).map((field, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-white">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-500">Field #{index + 1}</span>
                                                {isDraft && (
                                                    <div className="flex gap-1">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => moveFormField(index, -1)} disabled={index === 0}>↑</Button>
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => moveFormField(index, 1)} disabled={index === (event.customForm?.length ?? 0) - 1}>↓</Button>
                                                        <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeFormField(index)}>✕</Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label>Field Name</Label>
                                                    <Input value={field.fieldName} onChange={(e) => updateFormField(index, { fieldName: e.target.value })} disabled={!isDraft} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Field Type</Label>
                                                    {isDraft ? (
                                                        <Select value={field.fieldType} onValueChange={(val) => updateFormField(index, { fieldType: val as CustomFormField["fieldType"] })}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Text</SelectItem>
                                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                                                <SelectItem value="file">File Upload</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <Input value={field.fieldType} disabled className="bg-gray-100" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox
                                                    id={`req-${index}`}
                                                    checked={field.required}
                                                    onCheckedChange={(checked) => updateFormField(index, { required: Boolean(checked) })}
                                                    disabled={!isDraft}
                                                />
                                                <Label htmlFor={`req-${index}`}>Required</Label>
                                            </div>
                                            {field.fieldType === "dropdown" && (
                                                <div className="space-y-1">
                                                    <Label>Options (comma-separated)</Label>
                                                    <Input value={field.options.join(", ")} onChange={(e) => updateFormField(index, { options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} disabled={!isDraft} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isDraft && (
                                        <Button type="button" variant="outline" onClick={addFormField} className="w-full">+ Add Field</Button>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {!isLocked && (
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
