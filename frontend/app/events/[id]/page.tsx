'use client'
import { use, useCallback, useEffect, useState } from 'react'
import api from '@/lib/api'
import { Event } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AxiosError } from 'axios'

type ApiErrorResponse = {
    message?: string;
}

type RegistrationLookupItem = {
    event: string | { _id: string };
    ticketId: string;
    ticketQrCode?: string;
}

type RegistrationPayload = {
    customFormResponses?: Array<{ fieldName: string; value: string | boolean }>;
    merchandiseSelection?: { size: string; variant: string; color?: string };
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = use(params)
    const [event, setEvent] = useState<Event | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isRegistered, setIsRegistered] = useState(false)
    const [ticketId, setTicketId] = useState('')
    const [ticketQrCode, setTicketQrCode] = useState('')
    const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false)
    const [registrationCountForEvent, setRegistrationCountForEvent] = useState(0)
    const [customFormValues, setCustomFormValues] = useState<Record<string, string | boolean>>({})
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedVariant, setSelectedVariant] = useState('')
    const [selectedColor, setSelectedColor] = useState('')

    const fetchEventDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get(`/events/${eventId}`);
            setEvent(response.data);
        } catch (error) {
            console.error('Error fetching event details:', error);
            setError('Failed to load event details');
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const handleRegister = async () => {
        try {
            setIsSubmittingRegistration(true)
            if (!event) {
                return;
            }

            if (event.type === 'normal' && isRegistered) {
                return;
            }

            setError('');

            const payload: RegistrationPayload = {};

            if (event.type === 'normal') {
                const responses = (event.customForm || []).map((field) => ({
                    fieldName: field.fieldName,
                    value: customFormValues[field.fieldName] ?? (field.fieldType === 'checkbox' ? false : '')
                }));

                for (const field of event.customForm || []) {
                    const value = customFormValues[field.fieldName];

                    if (field.required) {
                        if (field.fieldType === 'checkbox') {
                            if (value !== true) {
                                setError(`${field.fieldName} is required`);
                                return;
                            }
                        } else if (typeof value !== 'string' || value.trim() === '') {
                            setError(`${field.fieldName} is required`);
                            return;
                        }
                    }
                }

                payload.customFormResponses = responses;
            }

            if (event.type === 'merchandise') {
                if (!selectedSize) {
                    setError('Please select a size');
                    return;
                }

                if (!selectedVariant) {
                    setError('Please select a variant');
                    return;
                }

                payload.merchandiseSelection = {
                    size: selectedSize,
                    variant: selectedVariant,
                    ...(selectedColor ? { color: selectedColor } : {})
                };
            }

            const response = await api.post(`/registrations/${eventId}`, payload);
            setTicketId(response.data.ticketId);
            setTicketQrCode(response.data.ticketQrCode || '');
            if (event.type === 'normal') {
                setIsRegistered(true);
                alert(`Successfully registered! Your ticket ID is: ${response.data.ticketId}`);
            } else {
                setRegistrationCountForEvent((prev) => prev + 1);
                alert(`Purchase successful! Your purchase ticket ID is: ${response.data.ticketId}`);
            }
        } catch (error: unknown) {
            console.error('Error registering for event:', error);
            const axiosError = error as AxiosError<ApiErrorResponse>;
            setError(axiosError.response?.data?.message || (event?.type === 'merchandise' ? 'Failed to complete purchase' : 'Failed to register for event'));
        } finally {
            setIsSubmittingRegistration(false)
        }
    };

    const checkExistingRegistration = useCallback(async () => {
        try {
            const response = await api.get('/registrations/my-registrations');
            const existing = (response.data as RegistrationLookupItem[]).find((reg) => {
                const eventId_str = typeof reg.event === 'object' ? reg.event._id : reg.event;
                return eventId_str === eventId;
            });

            const registrationsForCurrentEvent = (response.data as RegistrationLookupItem[]).filter((reg) => {
                const eventId_str = typeof reg.event === 'object' ? reg.event._id : reg.event;
                return eventId_str === eventId;
            });

            setRegistrationCountForEvent(registrationsForCurrentEvent.length);

            if (existing && event?.type !== 'merchandise') {
                setIsRegistered(true);
                setTicketId(existing.ticketId);
                setTicketQrCode(existing.ticketQrCode || '');
            }
        } catch {
        }
    }, [event?.type, eventId]);

    useEffect(() => {
        fetchEventDetails();
        checkExistingRegistration();
    }, [checkExistingRegistration, fetchEventDetails]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">Event not found</div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl mb-2">{event.name}</CardTitle>
                            <CardDescription>{event.description}</CardDescription>
                        </div>
                        <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Type</p>
                            <p className="font-semibold">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Eligibility</p>
                            <p className="font-semibold">{event.eligibility}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Start Date</p>
                            <p className="font-semibold">{new Date(event.start).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">End Date</p>
                            <p className="font-semibold">{new Date(event.end).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Registration Deadline</p>
                            <p className="font-semibold">{new Date(event.regDeadline).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Registration Fee</p>
                            <p className="font-semibold">₹{event.regFee}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Registration Limit</p>
                            <p className="font-semibold">{event.regLimit} spots</p>
                        </div>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {event.tags.map((tag: string, index: number) => (
                                    <Badge key={index} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {event.type === 'normal' && (event.customForm || []).length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">Registration Form</p>
                            {(event.customForm || []).map((field) => (
                                <div key={field.fieldName} className="space-y-2">
                                    <Label>{field.fieldName}{field.required ? ' *' : ''}</Label>
                                    {field.fieldType === 'dropdown' ? (
                                        <Select
                                            value={String(customFormValues[field.fieldName] || '')}
                                            onValueChange={(value) => setCustomFormValues((prev) => ({ ...prev, [field.fieldName]: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select an option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options.map((option) => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.fieldType === 'checkbox' ? (
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                checked={Boolean(customFormValues[field.fieldName])}
                                                onCheckedChange={(checked) => setCustomFormValues((prev) => ({ ...prev, [field.fieldName]: Boolean(checked) }))}
                                            />
                                            <span className="text-sm text-gray-700">Yes</span>
                                        </div>
                                    ) : (
                                        <Input
                                            placeholder={field.fieldType === 'file' ? 'Enter file URL' : 'Enter value'}
                                            value={String(customFormValues[field.fieldName] || '')}
                                            onChange={(e) => setCustomFormValues((prev) => ({ ...prev, [field.fieldName]: e.target.value }))}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {event.type === 'merchandise' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">Purchase Options</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label>Size *</Label>
                                    <Select value={selectedSize} onValueChange={setSelectedSize}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(event.itemDetails?.sizes || []).map((size) => (
                                                <SelectItem key={size} value={size}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Variant *</Label>
                                    <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(event.itemDetails?.variants || []).map((variant) => (
                                                <SelectItem key={variant} value={variant}>{variant}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Color</Label>
                                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select color (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(event.itemDetails?.colors || []).map((color) => (
                                                <SelectItem key={color} value={color}>{color}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {event.purchaseLimitPerParticipant && (
                                <p className="text-xs text-gray-500">
                                    Purchase limit per participant: {event.purchaseLimitPerParticipant}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="pt-4">
                        {(() => {
                            const registrationOpen = event.status === 'published';
                            const merchandiseLimitReached = event.type === 'merchandise'
                                ? registrationCountForEvent >= (event.purchaseLimitPerParticipant || 1)
                                : false;
                            const disabled = event.type === 'merchandise'
                                ? !registrationOpen || merchandiseLimitReached || isSubmittingRegistration
                                : isRegistered || !registrationOpen || isSubmittingRegistration;
                            let label = event.type === 'merchandise' ? 'Purchase' : 'Register Now';
                            if (isRegistered) label = `Already Registered (Ticket: ${ticketId})`;
                            else if (isSubmittingRegistration) label = event.type === 'merchandise' ? 'Processing Purchase...' : 'Registering...';
                            else if (event.type === 'merchandise' && merchandiseLimitReached) label = `Purchase Limit Reached (${registrationCountForEvent}/${event.purchaseLimitPerParticipant || 1})`;
                            else if (event.type === 'merchandise') label = `Purchase (${registrationCountForEvent}/${event.purchaseLimitPerParticipant || 1})`;
                            else if (!registrationOpen) label = `Event ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}`;
                            return (
                                <Button
                                    onClick={handleRegister}
                                    disabled={disabled}
                                    className="w-full"
                                    size="lg"
                                >
                                    {label}
                                </Button>
                            );
                        })()}

                        {error && (
                            <p className="text-red-600 mt-2 text-center text-sm">{error}</p>
                        )}

                        {ticketQrCode && (
                            <div className="mt-4 flex flex-col items-center">
                                <p className="text-sm font-medium mb-2">Ticket QR</p>
                                <img
                                    src={ticketQrCode}
                                    alt={`QR for ticket ${ticketId}`}
                                    className="h-40 w-40 border rounded"
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
