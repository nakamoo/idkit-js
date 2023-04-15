import type { FC } from 'react'
import { useMemo } from 'react'
import { useState } from 'react'
import { useCallback } from 'react'
import IDKitWidget from './IDKitWidget'
import type { ISuccessResult } from '..'
import SignInButton from './SignInButton'
import type { IDKitConfig, WidgetConfig } from '@/types/config'

type Props = Omit<WidgetConfig, 'autoClose'> &
	Pick<IDKitConfig, 'app_id' | 'walletConnectProjectId'> & {
		response_type: 'code' | 'id_token' | 'token'
		nonce?: string
		onSuccess: (jwt: string) => void
		children?: ({ open }: { open: () => void }) => JSX.Element
	}

const SignInWithWorldID: FC<Props> = ({ onSuccess, app_id, nonce, theme, response_type, children, ...props }) => {
	const [token, setToken] = useState<string>('')
	const signal = useMemo<string>(() => {
		if (nonce) return nonce
		return Date.now().toString()
	}, [nonce])

	const handleVerify = useCallback(
		async (proof: ISuccessResult) => {
			const response = await fetch('https://developer.worldcoin.org/api/v1/oidc/authorize', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ ...proof, app_id, nonce: signal, response_type: response_type }),
			})

			if (!response.ok) {
				if (response.status != 400) {
					throw new Error('Something went wrong when verifying your identity. Please try again.')
				}

				const error = (await response.json()) as { code: string; message: string }
				throw new Error(error.message)
			}

			const { jwt } = (await response.json()) as { jwt: string }
			setToken(jwt)
		},
		[app_id, signal, response_type]
	)

	const onIDKitSuccess = useCallback(() => void onSuccess(token), [onSuccess, token])

	return (
		<IDKitWidget
			{...props}
			action=""
			autoClose
			theme={theme}
			app_id={app_id}
			signal={signal}
			onSuccess={onIDKitSuccess}
			handleVerify={handleVerify}
		>
			{children ?? (({ open }) => <SignInButton onClick={open} theme={theme} />)}
		</IDKitWidget>
	)
}

export default SignInWithWorldID
