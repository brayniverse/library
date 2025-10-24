import AppLayout from '@/layouts/app-layout'
import SettingsLayout from '@/layouts/settings/layout'
import HeadingSmall from '@/components/heading-small'
import { Button } from '@/components/ui/button'
import { Form, Head, router, usePage } from '@inertiajs/react'
import { startRegistration } from '@simplewebauthn/browser'
import { useState } from 'react'
import { passkeyOptions, store, destroy } from '@/routes/passkeys';

function getCookie(name: string): string | undefined {
    return document.cookie
        .split('; ')
        .find((row) => row.startsWith(name + '='))
        ?.split('=')[1]
}

type Passkey = { id: string; name?: string; last_used_at?: string | null }

type PageProps = {
    passkeys: Passkey[]
}

export default function PasskeysSettings() {
    const { props } = usePage<{ passkeys: Passkey[] }>()
    const passkeys = (props as unknown as PageProps).passkeys || []
    const [busy, setBusy] = useState(false)

    const registerPasskey = async () => {
        try {
            setBusy(true)
            // 1) Ask server for registration options
            const res = await fetch(passkeyOptions.url(), {
                headers: { 'Accept': 'application/json' },
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Failed to fetch registration options')
            const optionsJSON = await res.json()

            // 2) Call WebAuthn API in the browser
            const attResp = await startRegistration(optionsJSON)

            // 3) Post back to server to store the passkey
            const xsrf = getCookie('XSRF-TOKEN')
            const storeRes = await fetch(store.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    // Use XSRF cookie as header (decoded) per Laravel expectations
                    'X-XSRF-TOKEN': xsrf ? decodeURIComponent(xsrf) : '',
                },
                credentials: 'include',
                body: JSON.stringify({
                    passkey: JSON.stringify(attResp),
                    options: JSON.stringify(optionsJSON),
                }),
            })

            if (!storeRes.ok) {
                const body = await storeRes.text()
                throw new Error(`Failed to store passkey: ${body}`)
            }

            // Reload the page via Inertia to refresh list
            router.reload({ only: ['passkeys'] })
        } catch (e) {
            console.error(e)
            alert('Could not create a passkey. See console for details.')
        } finally {
            setBusy(false)
        }
    }

    const deletePasskey = async (id: string) => {
        if (!confirm('Delete this passkey?')) return
        router.delete(destroy(id).url, {
            preserveScroll: true,
            onError: () => alert('Failed to delete passkey'),
            onSuccess: () => router.reload({ only: ['passkeys'] }),
        })
    }

    return (
        <AppLayout breadcrumbs={[{ title: 'Passkeys settings', href: '#' }]}>
            <Head title="Passkeys" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Passkeys"
                        description="Use a security key, Touch ID, Face ID, or Windows Hello to sign in."
                    />

                    <div>
                        <Form>
                            <Button onClick={registerPasskey} disabled={busy}>
                                {busy ? 'Creating…' : 'Create a new passkey'}
                            </Button>
                        </Form>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Existing passkeys</h3>
                        {passkeys.length === 0 ? (
                            <p className="text-sm text-neutral-600">You haven’t added any passkeys yet.</p>
                        ) : (
                            <ul className="divide-y divide-neutral-200 rounded border">
                                {passkeys.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between p-3">
                                        <div>
                                            <div className="text-sm font-medium">{p.name || 'Passkey'}</div>
                                            <div className="text-xs text-neutral-500">
                                                Last used: {p.last_used_at ? new Date(p.last_used_at).toLocaleString() : 'never'}
                                            </div>
                                        </div>
                                        <Button variant="destructive" onClick={() => deletePasskey(p.id)}>
                                            Delete
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    )
}
