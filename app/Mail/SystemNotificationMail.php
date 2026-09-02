<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SystemNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $mailSubject,
        public string $body,
        public string $senderAddress,
        public string $senderName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->senderAddress, $this->senderName),
            subject: $this->mailSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            text: 'mail.system-notification',
            with: ['body' => $this->body],
        );
    }
}
