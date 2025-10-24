import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head, router } from '@inertiajs/react';
import LaravelPasskeys from '@/actions/Spatie/LaravelPasskeys';
const {
    GeneratePasskeyAuthenticationOptionsController,
    AuthenticateUsingPasskeyController,
} = LaravelPasskeys.Http.Controllers;
import { startAuthentication } from '@simplewebauthn/browser';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

const passkeyLogin = async () => {
    try {
        // 1) Get authentication options from server
        const res = await fetch(GeneratePasskeyAuthenticationOptionsController.url(), {
            headers: { 'Accept': 'application/json' },
            credentials: 'include',
        })
        if (!res.ok) throw new Error('Failed to fetch authentication options')
        const optionsJSON = await res.json()

        // 2) Call WebAuthn
        const assertion = await startAuthentication(optionsJSON)

        // 3) Post back to Spatie’s auth endpoint
        const loginRes = await fetch(AuthenticateUsingPasskeyController.url(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            credentials: 'include',
            body: JSON.stringify({
                start_authentication_response: JSON.stringify(assertion),
            }),
        })

        if (loginRes.redirected) {
            // Spatie’s controller will redirect you to intended/after-login URL
            window.location.href = loginRes.url
            return
        }

        if (!loginRes.ok) {
            const body = await loginRes.text()
            throw new Error(`Passkey login failed: ${body}`)
        }

        // Fallback, but generally you’ll be redirected
        router.visit('/')
    } catch (e) {
        console.error(e)
        alert('Passkey login failed. See console for details.')
    }
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register()} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            <hr />

            <div className="flex flex-col gap-3">
                <Button type="button" onClick={passkeyLogin}>
                    Sign in with a passkey
                </Button>
            </div>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
