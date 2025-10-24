<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Validation\ValidationException;
use Spatie\LaravelPasskeys\Actions\GeneratePasskeyRegisterOptionsAction;
use Spatie\LaravelPasskeys\Actions\StorePasskeyAction;
use Str;
use Throwable;

final class PasskeysController extends Controller
{
    public function create(StorePasskeyAction $storePasskeyAction)
    {
        $data = request()->validate([
            'passkey' => 'required|json',
            'options' => 'required|json',
        ]);

        $user = auth()->user();

        try {
            $storePasskeyAction->execute(
                $user,
                $data['passkey'],
                $data['options'],
                request()->getHost(),
                ['name' => Str::random(10)],
            );

            return redirect()->back();

        } catch (Throwable $exception) {
            logger()->error($exception);
            throw ValidationException::withMessages([
                'name' => __('passkeys::passkeys.error_something_went_wrong_generating_the_passkey'),
            ]);
        }
    }

    public function show(GeneratePasskeyRegisterOptionsAction $generatePasskeyRegisterOptionsAction): string
    {
        return $generatePasskeyRegisterOptionsAction->execute(auth()->user());
    }

    public function destroy(string $id)
    {
        auth()->user()->passkeys()->where('id', $id)->delete();

        return redirect()->back();
    }
}
