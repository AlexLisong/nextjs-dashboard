'use client'

import {
  Alert, Button, Col, Form, FormControl, InputGroup, Row,
} from 'react-bootstrap'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-regular-svg-icons'
import { faLock } from '@fortawesome/free-solid-svg-icons'
import { useState } from 'react'
import Link from 'next/link'
import InputGroupText from 'react-bootstrap/InputGroupText'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import useDictionary from '@/locales/dictionary-hook'
import dynamic from 'next/dynamic';
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { http } from "viem";
import { mainnet } from "viem/chains";
import { createConfig, WagmiProvider } from "wagmi";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
export default function Login({ callbackUrl }: { callbackUrl: string }) {
  const DynamicWidget = dynamic(
  () => import('@dynamic-labs/sdk-react-core').then((mod) => mod.DynamicWidget),
  { ssr: false }
  );
  const DynamicContextProvider = dynamic(
  () =>
    import("@dynamic-labs/sdk-react-core").then(
      (mod) => mod.DynamicContextProvider,
    ),
  { ssr: false },
);

const DynamicWagmiConnector = dynamic(
  () =>
    import("@dynamic-labs/wagmi-connector").then(
      (mod) => mod.DynamicWagmiConnector,
    ),
  { ssr: false },
  );
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}
  const config = createConfig({
  chains: [mainnet],
  multiInjectedProviderDiscovery: false,
  transports: {
    [mainnet.id]: http(),
  },
});
const cssOverrides = `
.button--padding-large {
  padding: 10px 20px !important;
}
`;
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const dict = useDictionary()
  const queryClient = getQueryClient();

  const login = async (formData: FormData) => {
    setSubmitting(true)

    try {
      const res = await signIn('credentials', {
        username: formData.get('username'),
        password: formData.get('password'),
        redirect: false,
        callbackUrl,
      })

      if (!res) {
        setError('Login failed')
        return
      }

      const { ok, url, error: err } = res

      if (!ok) {
        if (err) {
          setError(err)
          return
        }

        setError('Login failed')
        return
      }

      if (url) {
        router.push(url)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }
    const dynamicEnvironmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;

  return (
    <>
      <Alert
        variant="danger"
        show={error !== ''}
        onClose={() => setError('')}
        dismissible
      >
        {error}
      </Alert>
      <DynamicContextProvider
          settings={{
            cssOverrides: cssOverrides,
            environmentId: dynamicEnvironmentId || '',
            walletConnectors: [
              EthereumWalletConnectors,
              SolanaWalletConnectors,
            ],
          }}
        >
          <WagmiProvider config={config}><QueryClientProvider client={queryClient}>
              <DynamicWagmiConnector>
          <DynamicWidget
            buttonClassName="dynamic-inner-button custom-login-button"
            innerButtonComponent={<span>Log in</span>}
          />         
            </DynamicWagmiConnector>            </QueryClientProvider>

          </WagmiProvider>
      </DynamicContextProvider>              
      <Form action={login}>
        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon
              icon={faUser}
              fixedWidth
            />
          </InputGroupText>
          <FormControl
            name="username"
            required
            disabled={submitting}
            placeholder={dict.login.form.username}
            aria-label="Username"
            defaultValue="Username"
          />
        </InputGroup>

        <InputGroup className="mb-3">
          <InputGroupText>
            <FontAwesomeIcon
              icon={faLock}
              fixedWidth
            />
          </InputGroupText>
          <FormControl
            type="password"
            name="password"
            required
            disabled={submitting}
            placeholder={dict.login.form.password}
            aria-label="Password"
            defaultValue="Password"
          />
        </InputGroup>

        <Row className="align-items-center">
          <Col xs={6}>
            <Button
              className="px-4"
              variant="primary"
              type="submit"
              disabled={submitting}
            >
              {dict.login.form.submit}
            </Button>
          </Col>
          <Col xs={6} className="text-end">
            <Link className="px-0" href="#">
              {dict.login.forgot_password}
            </Link>
          </Col>
        </Row>
      </Form>
    </>
  )
}
