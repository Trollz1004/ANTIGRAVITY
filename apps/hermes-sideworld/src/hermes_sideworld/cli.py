"""CLI entry point for hermes-sideworld."""

from __future__ import annotations

import json
import sys

import click
from rich.console import Console
from rich.table import Table

from . import __version__

console = Console()


@click.group()
@click.version_option(__version__)
def main() -> None:
    """Hermes Sideworld — Lead generation parsing engine."""


@main.command()
@click.option("--source", default="unknown", help="Source label for parsed leads")
@click.option("--file", "file_path", default=None, help="Path to JSON file of lead records")
def parse(source: str, file_path: str | None) -> None:
    """Parse leads from a JSON file."""
    from .parser import parse_leads

    if file_path:
        import pathlib
        data = json.loads(pathlib.Path(file_path).read_text())
    elif not sys.stdin.isatty():
        data = json.load(sys.stdin)
    else:
        console.print("[yellow]No input. Pipe JSON or pass --file.[/]")
        return

    result = parse_leads(data, source=source)
    console.print(f"[bold green]Parsed {result.total} leads[/] from [cyan]{source}[/]")
    for lead in result.leads:
        console.print(f"  [white]{lead.name}[/] — {lead.email or lead.url or 'no contact'}")
    for err in result.errors:
        console.print(f"  [red]ERR:[/] {err}")


@main.command()
@click.option("--name", required=True, help="Contact name")
@click.option("--product", required=True, help="Product slug (e.g. platform-pro)")
@click.option("--email", default=None, help="Contact email")
@click.option("--phone", default=None, help="Contact phone")
@click.option("--base-url", default="https://youandinotai.com", show_default=True, help="Base purchase URL")
def demo(name: str, product: str, email: str | None, phone: str | None, base_url: str) -> None:
    """Create a demo contact lead and generate a purchase QR code."""
    from .demo import create_demo_contact

    contact = create_demo_contact(name=name, product=product, base_url=base_url, email=email, phone=phone)

    console.print("\n[bold green]Demo contact created[/]")
    console.print(f"  ID       : [cyan]{contact.id}[/]")
    console.print(f"  Name     : {contact.name}")
    console.print(f"  Product  : [yellow]{contact.product}[/]")
    console.print(f"  Buy URL  : {contact.purchase_url}")
    if contact.qr_path:
        console.print(f"  QR Code  : [blue]{contact.qr_path}[/]")
    console.print("\n[dim]To activate after purchase:[/]")
    console.print(f"  [bold]sideworld activate --contact-id {contact.id}[/]")


@main.command()
@click.option("--contact-id", required=True, help="Demo contact ID from 'sideworld demo'")
def activate(contact_id: str) -> None:
    """Issue a license key for a contact who has purchased."""
    from .demo import issue_license

    key_record = issue_license(contact_id)
    if key_record is None:
        console.print(f"[red]No contact found with ID: {contact_id}[/]")
        raise SystemExit(1)

    console.print("\n[bold green]License issued[/]")
    console.print(f"  Contact  : [cyan]{key_record.contact_id}[/]")
    console.print(f"  Product  : [yellow]{key_record.product}[/]")
    console.print(f"  Key      : [bold white]{key_record.key}[/]")
    console.print(f"  Issued   : {key_record.issued_at}")


@main.command("admin-key")
@click.option("--email", required=True, help="Admin/test recipient email")
@click.option("--product", default="all-access", show_default=True, help="Product slug to unlock")
@click.option("--secret", envvar="AI_SOLUTIONS_ADMIN_SECRET", required=True, help="Admin secret from private env")
@click.option("--name", default="Josh Admin", show_default=True, help="Display name for the local record")
@click.option("--send-email/--no-send-email", default=False, show_default=True, help="Send/print the license email")
def admin_key(email: str, product: str, secret: str, name: str, send_email: bool) -> None:
    """Issue an admin/test license key without a purchase."""
    from .demo import issue_admin_license
    from .email_delivery import send_license_email

    key_record = issue_admin_license(buyer_email=email, product=product, admin_secret=secret, buyer_name=name)
    console.print("\n[bold green]Admin license issued[/]")
    console.print(f"  Email    : {email}")
    console.print(f"  Product  : [yellow]{key_record.product}[/]")
    console.print(f"  Key      : [bold white]{key_record.key}[/]")
    console.print(f"  Contact  : [cyan]{key_record.contact_id}[/]")
    if send_email:
        result = send_license_email(buyer_email=email, product=product, license_key=key_record.key, admin=True)
        console.print(f"  Delivery : {result.provider} — {result.detail}")


@main.command("webhook-file")
@click.option("--payload", "payload_path", required=True, help="Path to a Stripe webhook JSON payload")
@click.option("--signature", required=True, help="Stripe-Signature header value")
@click.option("--secret", envvar="STRIPE_WEBHOOK_SECRET", required=True, help="Stripe webhook signing secret")
def webhook_file(payload_path: str, signature: str, secret: str) -> None:
    """Process a saved Stripe webhook payload for local testing."""
    from pathlib import Path

    from .fulfillment import handle_stripe_webhook

    result = handle_stripe_webhook(Path(payload_path).read_bytes(), signature, secret)
    if result is None:
        console.print("[yellow]Webhook verified; no fulfillment needed for this event type.[/]")
        return
    console.print("[bold green]Webhook fulfilled[/]")
    console.print(f"  Product  : [yellow]{result.product}[/]")
    console.print(f"  Buyer    : {result.buyer_email}")
    console.print(f"  Key      : [bold white]{result.license_key}[/]")
    console.print(f"  Delivery : {result.delivery.provider} — {result.delivery.detail}")


@main.command("list")
def list_contacts() -> None:
    """List all demo contacts and their purchase status."""
    from .demo import list_contacts as _list

    contacts = _list()
    if not contacts:
        console.print("[dim]No demo contacts yet. Run 'sideworld demo' to create one.[/]")
        return

    table = Table(title="Demo Contacts", show_lines=True)
    table.add_column("ID", style="cyan", no_wrap=True, max_width=36)
    table.add_column("Name")
    table.add_column("Product", style="yellow")
    table.add_column("Email")
    table.add_column("Purchased", justify="center")
    table.add_column("License Key", style="dim", max_width=36)

    for c in contacts:
        table.add_row(
            c.id,
            c.name,
            c.product,
            c.email or "",
            "[green]YES[/]" if c.purchased else "[red]NO[/]",
            c.license_key or "",
        )

    console.print(table)


if __name__ == "__main__":
    main()
