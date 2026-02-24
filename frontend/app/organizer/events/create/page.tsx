"use client";
import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { CustomFormField } from "@/lib/definitions";
import type { AxiosError } from "axios";

type CreateEventPayload = {
    name: string;
    description: string;
    type: "normal" | "merchandise";
    eligibility: string;
    regDeadline: string;
    regLimit: number;
    regFee: number;
    tags: string[];
    start: string;
    end: string;
    status: "draft";
    itemDetails?: {
        sizes: string[];
        colors: string[];
        variants: string[];
    };
    stockQuantity?: number;
    purchaseLimitPerParticipant?: number;
    customForm?: CustomFormField[];
};

type ApiErrorResponse = {
    message?: string;
};

export default function EventCreatePage() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState<"normal" | "merchandise">("normal");
    const [eligibility, setEligibility] = useState("All");
    const [regDeadline, setRegDeadline] = useState("");
    const [regLimit, setRegLimit] = useState<number>(100);
    const [regFee, setRegFee] = useState<number>(0);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const [sizes, setSizes] = useState<string[]>([]);
    const [sizeInput, setSizeInput] = useState("");
    const [colors, setColors] = useState<string[]>([]);
    const [colorInput, setColorInput] = useState("");
    const [variants, setVariants] = useState<string[]>([]);
    const [variantInput, setVariantInput] = useState("");
    const [stockQuantity, setStockQuantity] = useState<number>(0);
    const [purchaseLimit, setPurchaseLimit] = useState<number>(1);
    const [customForm, setCustomForm] = useState<CustomFormField[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError("");
            const payload: CreateEventPayload = {
                name, description, type, eligibility,
                regDeadline, regLimit, regFee, tags,
                start, end, status: "draft",
            };

            if (type === "merchandise") {
                payload.itemDetails = { sizes, colors, variants };
                payload.stockQuantity = stockQuantity;
                payload.purchaseLimitPerParticipant = purchaseLimit;
            } else {
                payload.customForm = customForm;
            }

            await api.post("/events/create", payload);
            router.push("/organizer/dashboard");
        } catch (err: unknown) {
            const axiosError = err as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || "Failed to create event");
        } finally {
            setLoading(false);
        }
    };

    const addTag = () => {
        const trimmed = tagInput.trim();
        if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
        setTagInput("");
    };
    const removeTag = (t: string) => setTags(tags.filter(x => x !== t));
    const addChip = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
        const trimmed = input.trim();
        if (trimmed && !list.includes(trimmed)) setList([...list, trimmed]);
        setInput("");
    };
    const removeChip = (list: string[], setList: (v: string[]) => void, item: string) => {
        setList(list.filter(x => x !== item));
    };
    const addFormField = () => {
        setCustomForm([...customForm, {
            fieldName: "", fieldType: "text", required: false, options: [], order: customForm.length
        }]);
    };
    const updateFormField = (index: number, updates: Partial<CustomFormField>) => {
        const updated = [...customForm];
        updated[index] = { ...updated[index], ...updates };
        setCustomForm(updated);
    };
    const removeFormField = (index: number) => {
        setCustomForm(customForm.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
    };
    const moveFormField = (index: number, direction: -1 | 1) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= customForm.length) return;
        const updated = [...customForm];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setCustomForm(updated.map((f, i) => ({ ...f, order: i })));
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {error && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Create New Event</CardTitle>
                    <CardDescription>Fill in the details below. The event will be saved as a Draft.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Event Name *</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter event name" required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description" value={description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                                placeholder="Describe your event" rows={4} required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="type">Event Type *</Label>
                                <Select value={type} onValueChange={(val: "normal" | "merchandise") => setType(val)}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="merchandise">Merchandise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="eligibility">Eligibility *</Label>
                                <Select value={eligibility} onValueChange={setEligibility}>
                                    <SelectTrigger><SelectValue placeholder="Select eligibility" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IIIT-H">IIIT-H</SelectItem>
                                        <SelectItem value="External">External</SelectItem>
                                        <SelectItem value="All">All</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="start">Event Start *</Label>
                                <Input id="start" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end">Event End *</Label>
                                <Input id="end" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="regDeadline">Registration Deadline *</Label>
                                <Input id="regDeadline" type="datetime-local" value={regDeadline} onChange={(e) => setRegDeadline(e.target.value)} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="regLimit">Registration Limit *</Label>
                                <Input id="regLimit" type="number" min={1} value={regLimit} onChange={(e) => setRegLimit(Number(e.target.value))} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="regFee">{type === "merchandise" ? "Item Price (₹) *" : "Registration Fee (₹) *"}</Label>
                                <Input id="regFee" type="number" min={0} value={regFee} onChange={(e) => setRegFee(Number(e.target.value))} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tags</Label>
                            <div className="flex gap-2">
                                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                                    placeholder="Type a tag and press Enter" />
                                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                            </div>
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} ✕</Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                        {type === "merchandise" && (
                            <Card className="border-orange-200 bg-orange-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Merchandise Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Sizes</Label>
                                        <div className="flex gap-2">
                                            <Input value={sizeInput} onChange={(e) => setSizeInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(sizes, setSizes, sizeInput, setSizeInput); } }}
                                                placeholder="e.g. S, M, L, XL" />
                                            <Button type="button" variant="outline" onClick={() => addChip(sizes, setSizes, sizeInput, setSizeInput)}>Add</Button>
                                        </div>
                                        {sizes.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {sizes.map((s) => (
                                                    <Badge key={s} variant="secondary" className="cursor-pointer" onClick={() => removeChip(sizes, setSizes, s)}>{s} ✕</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Colors</Label>
                                        <div className="flex gap-2">
                                            <Input value={colorInput} onChange={(e) => setColorInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(colors, setColors, colorInput, setColorInput); } }}
                                                placeholder="e.g. Red, Blue, Black" />
                                            <Button type="button" variant="outline" onClick={() => addChip(colors, setColors, colorInput, setColorInput)}>Add</Button>
                                        </div>
                                        {colors.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {colors.map((c) => (
                                                    <Badge key={c} variant="secondary" className="cursor-pointer" onClick={() => removeChip(colors, setColors, c)}>{c} ✕</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Variants</Label>
                                        <div className="flex gap-2">
                                            <Input value={variantInput} onChange={(e) => setVariantInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addChip(variants, setVariants, variantInput, setVariantInput); } }}
                                                placeholder="e.g. Limited Edition, Standard" />
                                            <Button type="button" variant="outline" onClick={() => addChip(variants, setVariants, variantInput, setVariantInput)}>Add</Button>
                                        </div>
                                        {variants.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-1">
                                                {variants.map((v) => (
                                                    <Badge key={v} variant="secondary" className="cursor-pointer" onClick={() => removeChip(variants, setVariants, v)}>{v} ✕</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="stockQuantity">Stock Quantity *</Label>
                                            <Input id="stockQuantity" type="number" min={0} value={stockQuantity} onChange={(e) => setStockQuantity(Number(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="purchaseLimit">Purchase Limit Per Participant *</Label>
                                            <Input id="purchaseLimit" type="number" min={1} value={purchaseLimit} onChange={(e) => setPurchaseLimit(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        {type === "normal" && (
                            <Card className="border-blue-200 bg-blue-50/30">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Custom Registration Form</CardTitle>
                                    <CardDescription>Define additional fields participants must fill out when registering.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {customForm.map((field, index) => (
                                        <div key={index} className="border rounded-lg p-4 space-y-3 bg-white">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-500">Field #{index + 1}</span>
                                                <div className="flex gap-1">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => moveFormField(index, -1)} disabled={index === 0}>↑</Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => moveFormField(index, 1)} disabled={index === customForm.length - 1}>↓</Button>
                                                    <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => removeFormField(index)}>✕</Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label>Field Name</Label>
                                                    <Input value={field.fieldName} onChange={(e) => updateFormField(index, { fieldName: e.target.value })} placeholder="e.g. T-shirt size preference" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Field Type</Label>
                                                    <Select value={field.fieldType} onValueChange={(val) => updateFormField(index, { fieldType: val as CustomFormField["fieldType"] })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text</SelectItem>
                                                            <SelectItem value="dropdown">Dropdown</SelectItem>
                                                            <SelectItem value="checkbox">Checkbox</SelectItem>
                                                            <SelectItem value="file">File Upload</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input type="checkbox" id={`req-${index}`} checked={field.required}
                                                    onChange={(e) => updateFormField(index, { required: e.target.checked })} />
                                                <Label htmlFor={`req-${index}`}>Required</Label>
                                            </div>
                                            {field.fieldType === "dropdown" && (
                                                <div className="space-y-1">
                                                    <Label>Options (comma-separated)</Label>
                                                    <Input value={field.options.join(", ")}
                                                        onChange={(e) => updateFormField(index, { options: e.target.value.split(",").map(s => s.trim()) })}
                                                        placeholder="Option 1, Option 2, Option 3" />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" onClick={addFormField} className="w-full">+ Add Field</Button>
                                </CardContent>
                            </Card>
                        )}

                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Creating..." : "Create Event (Draft)"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}