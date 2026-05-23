import type { FC } from 'react';
import { Divider } from '@react-spectrum/s2/Divider';
import { Link } from '@react-spectrum/s2/Link';
import { Badge } from '@react-spectrum/s2/Badge';
import { StatusLight } from '@react-spectrum/s2/StatusLight';
import { Button } from '@react-spectrum/s2/Button';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import DataUploadIcon from '@react-spectrum/s2/icons/DataUpload';
import PluginIcon from '@react-spectrum/s2/icons/Plugin';
import RefreshIcon from '@react-spectrum/s2/icons/Refresh';

interface DashboardFooterProps {
  isOnline: boolean;
}

const footerStyles = style({
  marginTop: 32,
  padding: 32,
  backgroundColor: 'layer-1',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'gray-200',
  borderRadius: 'lg',
  boxShadow: 'elevated',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});

const gridStyles = style({
  display: 'grid',
  gridTemplateColumns: {
    default: '1fr',
    md: '1fr 1fr',
    lg: '1.2fr 1fr 1fr',
  },
  gap: 32,
  alignItems: 'start',
});

const sectionTitleStyles = style({
  font: 'body-sm',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'neutral',
  margin: 0,
  marginBottom: 12,
});

const listStyles = style({
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const corporateTextStyles = style({
  font: 'body-xs',
  color: 'neutral-subdued',
  lineHeight: 'body',
  margin: 0,
});

export const DashboardFooter: FC<DashboardFooterProps> = ({ isOnline }) => {
  return (
    <footer className={footerStyles}>
      {/* 3-Column Footer Grid */}
      <div className={gridStyles}>
        {/* Column 1: Corporate Trust & Logo */}
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 16 })}>
          <div className={style({ display: 'flex', alignItems: 'center' })}>
            {/* Bushers Electronics Corporate Logo Emblem */}
            <div 
              className={style({ 
                display: 'flex', 
                alignItems: 'center',
                boxShadow: 'elevated',
                borderRadius: 'lg',
                overflow: 'hidden',
                paddingX: 8,
                paddingY: 4,
              })}
              style={{ backgroundColor: '#f5c700', border: '1px solid #d9b000' }}
            >
              <svg width="90" height="34" viewBox="0 0 350 131" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_288_14_footer_s2)">
                  <rect width="350" height="131" rx="16" fill="#FAD900"/>
                  <path d="M24.998 106.161V21.2529H54.7392C65.0417 21.2529 72.8561 23.2356 78.1823 27.2011C83.5084 31.1277 86.1715 36.901 86.1715 44.521C86.1715 48.6808 85.1024 52.3548 82.9641 55.5427C80.826 58.6918 77.8518 61.005 74.0418 62.4823C78.396 63.5709 81.8172 65.7674 84.3055 69.072C86.8325 72.3766 88.0959 76.4198 88.0959 81.2018C88.0959 89.366 85.4912 95.5475 80.2816 99.7463C75.072 103.945 67.6464 106.083 58.0049 106.161H24.998ZM42.4928 69.1887V92.1069H57.48C61.601 92.1069 64.8084 91.1349 67.1022 89.1911C69.4348 87.2083 70.6012 84.4869 70.6012 81.0268C70.6012 73.2513 66.5773 69.3053 58.5297 69.1887H42.4928ZM42.4928 56.8257H55.439C64.2641 56.6701 68.6768 53.1517 68.6768 46.2704C68.6768 42.4216 67.5493 39.6613 65.2944 37.9896C63.0784 36.279 59.56 35.4237 54.7392 35.4237H42.4928V56.8257Z" fill="#BB121A"/>
                  <path d="M130.472 63.707V91.6696C130.472 96.3154 129.015 99.9893 126.099 102.691C123.202 105.393 119.237 106.744 114.202 106.744C109.245 106.744 105.309 105.432 102.393 102.808C99.4775 100.184 97.9904 96.5779 97.9321 91.9903V63.707H106.68V91.7279C106.68 94.5076 107.34 96.539 108.662 97.8219C110.004 99.0855 111.85 99.7172 114.202 99.7172C119.12 99.7172 121.618 97.1319 121.696 91.9612V63.707H130.472Z" fill="#BB121A"/>
                  <path d="M159.66 95.0229C159.66 93.3706 159.077 92.1071 157.91 91.2323C156.744 90.3381 154.644 89.4051 151.612 88.4332C148.58 87.4418 146.179 86.4698 144.41 85.5173C139.589 82.9126 137.179 79.4039 137.179 74.9913C137.179 72.6975 137.82 70.6565 139.103 68.8681C140.406 67.0603 142.262 65.651 144.672 64.6402C147.102 63.6294 149.824 63.124 152.837 63.124C155.869 63.124 158.571 63.678 160.943 64.786C163.314 65.8746 165.151 67.4199 166.453 69.4221C167.775 71.4243 168.436 73.6986 168.436 76.2451H159.689C159.689 74.3012 159.077 72.7947 157.852 71.7256C156.627 70.637 154.907 70.0928 152.691 70.0928C150.553 70.0928 148.891 70.5496 147.705 71.4632C146.519 72.3574 145.926 73.5431 145.926 75.0205C145.926 76.4006 146.616 77.5572 147.996 78.4903C149.396 79.4233 151.447 80.2981 154.149 81.1145C159.125 82.6113 162.75 84.4677 165.025 86.6837C167.299 88.8997 168.436 91.66 168.436 94.9645C168.436 98.6385 167.046 101.525 164.267 103.624C161.487 105.704 157.745 106.744 153.041 106.744C149.775 106.744 146.801 106.151 144.118 104.966C141.436 103.76 139.385 102.118 137.966 100.038C136.567 97.9581 135.867 95.5477 135.867 92.8069H144.643C144.643 97.4916 147.442 99.8339 153.041 99.8339C155.121 99.8339 156.744 99.416 157.91 98.5801C159.077 97.7248 159.66 96.5391 159.66 95.0229Z" fill="#BB121A"/>
                  <path d="M208.937 106.161H200.189V87.9665H183.132V106.161H174.384V63.707H183.132V80.9103H200.189V63.707H208.937V106.161Z" fill="#BB121A"/>
                  <path d="M242.148 87.7624H225.353V99.134H245.064V106.161H216.605V63.707H245.005V70.7924H225.353V80.9103H242.148V87.7624Z" fill="#BB121A"/>
                  <path d="M265.912 90.6199H258.943V106.161H250.195V63.707H265.97C270.985 63.707 274.853 64.8248 277.575 67.0602C280.296 69.2957 281.657 72.4545 281.657 76.5366C281.657 79.4329 281.025 81.8531 279.762 83.7969C278.518 85.7214 276.622 87.257 274.076 88.4039L283.261 105.753V106.161H273.872L265.912 90.6199ZM258.943 83.5345H265.999C268.196 83.5345 269.896 82.9805 271.102 81.8725C272.307 80.7451 272.909 79.1997 272.909 77.2364C272.909 75.2342 272.336 73.6597 271.189 72.5128C270.062 71.3659 268.322 70.7924 265.97 70.7924H258.943V83.5345Z" fill="#BB121A"/>
                  <path d="M290.2 76.7408L286.235 74.4373C287.906 71.8131 288.771 69.1014 288.83 66.3022V61.3745H295.536V65.894C295.536 67.6435 295.05 69.5388 294.078 71.5798C293.106 73.6209 291.814 75.3412 290.2 76.7408Z" fill="#BB121A"/>
                  <path d="M324.053 95.0229C324.053 93.3706 323.469 92.1071 322.303 91.2323C321.137 90.3381 319.037 89.4051 316.005 88.4332C312.973 87.4418 310.572 86.4698 308.803 85.5173C303.982 82.9126 301.572 79.4039 301.572 74.9913C301.572 72.6975 302.213 70.6565 303.496 68.8681C304.799 67.0603 306.655 65.651 309.065 64.6402C311.495 63.6294 314.217 63.124 317.23 63.124C320.262 63.124 322.964 63.678 325.336 64.786C327.707 65.8746 329.544 67.4199 330.846 69.4221C332.168 71.4243 332.829 73.6986 332.829 76.2451H324.082C324.082 74.3012 323.469 72.7947 322.245 71.7256C321.02 70.637 319.3 70.0928 317.084 70.0928C314.946 70.0928 313.284 70.5496 312.098 71.4632C310.912 72.3574 310.319 73.5431 310.319 75.0205C310.319 76.4006 311.009 77.5572 312.389 78.4903C313.789 79.4233 315.84 80.2981 318.542 81.1145C323.518 82.6113 327.143 84.4677 329.418 86.6837C331.692 88.8997 332.829 91.66 332.829 94.9645C332.829 98.6385 331.439 101.525 328.66 103.624C325.88 105.704 322.138 106.744 317.434 106.744C314.168 106.744 311.194 106.151 308.511 104.966C305.829 103.76 303.778 102.118 302.359 100.038C300.959 97.9581 300.26 95.5477 300.26 92.8069H309.036C309.036 97.4916 311.835 99.8339 317.434 99.8339C319.514 99.8339 321.137 99.416 322.303 98.5801C323.469 97.7248 324.053 96.5391 324.053 95.0229Z" fill="#BB121A"/>
                  <path d="M114.134 36.0311H103.871V42.9805H115.916V47.2748H98.5249V21.3306H115.88V25.6606H103.871V31.8437H114.134V36.0311Z" fill="#095ABA"/>
                  <path d="M124.398 42.9805H135.748V47.2748H119.052V21.3306H124.398V42.9805Z" fill="#095ABA"/>
                  <path d="M154.44 36.0311H144.177V42.9805H156.222V47.2748H138.831V21.3306H156.187V25.6606H144.177V31.8437H154.44V36.0311Z" fill="#095ABA"/>
                  <path d="M179.725 38.633C179.523 41.4246 178.49 43.6223 176.625 45.2259C174.772 46.8296 172.324 47.6315 169.283 47.6315C165.957 47.6315 163.338 46.5148 161.425 44.2815C159.525 42.0364 158.574 38.9597 158.574 35.0514V33.4655C158.574 30.9709 159.014 28.7733 159.893 26.8726C160.772 24.9719 162.025 23.5167 163.653 22.507C165.292 21.4854 167.193 20.9746 169.355 20.9746C172.348 20.9746 174.76 21.7764 176.589 23.3801C178.418 24.9838 179.476 27.2349 179.761 30.1334H174.415C174.285 28.4585 173.815 27.2468 173.008 26.4984C172.212 25.7381 170.994 25.358 169.355 25.358C167.573 25.358 166.236 25.9995 165.345 27.2824C164.466 28.5535 164.015 30.5314 163.991 33.2161V35.1761C163.991 37.9796 164.413 40.0288 165.256 41.3236C166.112 42.6185 167.454 43.2659 169.283 43.2659C170.935 43.2659 172.164 42.8917 172.972 42.1433C173.792 41.383 174.261 40.2129 174.38 38.633H179.725Z" fill="#095ABA"/>
                  <path d="M202.23 25.6606H194.283V47.2748H188.938V25.6606H181.097V21.3306H202.23V25.6606Z" fill="#095ABA"/>
                  <path d="M214.9 37.7774H210.641V47.2748H205.295V21.3306H214.935C218 21.3306 220.364 22.0137 222.027 23.3798C223.69 24.7459 224.522 26.6763 224.522 29.1709C224.522 30.9409 224.136 32.4199 223.363 33.6078C222.603 34.7838 221.445 35.7223 219.889 36.4232L225.502 47.0253V47.2748H219.764L214.9 37.7774ZM210.641 33.4474H214.953C216.295 33.4474 217.335 33.1089 218.071 32.4317C218.808 31.7428 219.176 30.7984 219.176 29.5986C219.176 28.375 218.826 27.4128 218.125 26.7119C217.436 26.011 216.373 25.6606 214.935 25.6606H210.641V33.4474Z" fill="#095ABA"/>
                  <path d="M249.913 34.891C249.913 37.4451 249.462 39.6843 248.559 41.6087C247.656 43.5332 246.362 45.0181 244.675 46.0634C243 47.1088 241.075 47.6315 238.901 47.6315C236.751 47.6315 234.833 47.1147 233.146 46.0812C231.459 45.0478 230.152 43.5747 229.226 41.6622C228.299 39.7378 227.818 35.0336 227.818 35.0336V33.7328V34.891ZM244.497 33.715C244.497 30.9947 244.009 28.9277 243.035 27.5141C242.061 26.1004 240.671 25.3936 238.866 25.3936C237.072 25.3936 235.688 26.0945 234.714 27.4962C233.74 28.8861 233.247 30.9293 233.235 33.6259V34.891C233.235 37.5401 233.722 39.5952 234.696 41.0563C235.67 42.5175 237.072 43.2481 238.901 43.2481C240.695 43.2481 242.073 42.5472 243.035 41.1454C243.998 39.7318 244.485 37.6767 244.497 34.9801V33.715Z" fill="#095ABA"/>
                  <path d="M274.895 47.2748H269.55L259.144 30.2044V47.2748H253.798V21.3306H259.144L269.568 38.4367V21.3306H274.895V47.2748Z" fill="#095ABA"/>
                  <path d="M285.248 47.2748H279.902V21.3306H285.248V47.2748Z" fill="#095ABA"/>
                  <path d="M310.586 38.633C310.384 41.4246 309.351 43.6223 307.486 45.2259C305.633 46.8296 303.186 47.6315 300.145 47.6315C296.818 47.6315 294.199 46.5148 292.287 44.2815C290.386 42.0364 289.436 38.9597 289.436 35.0514V33.4655C289.436 30.9709 289.875 28.7733 290.754 26.8726C291.633 24.9719 292.886 23.5167 294.514 22.507C296.153 21.4854 298.054 20.9746 300.216 20.9746C303.209 20.9746 305.621 21.7764 307.45 23.3801C309.28 24.9838 310.337 27.2349 310.622 30.1334H305.276C305.146 28.4585 304.677 27.2468 303.869 26.4984C303.073 25.7381 301.855 25.358 300.216 25.358C298.434 25.358 297.098 25.9995 296.207 27.2824C295.328 28.5535 294.876 30.5314 294.852 33.2161V35.1761C294.852 37.9796 295.274 40.0288 296.118 41.3236C296.973 42.6185 298.315 43.2659 300.145 43.2659C301.796 43.2659 303.025 42.8917 303.833 42.1433C304.653 41.383 305.122 40.2129 305.241 38.633H310.586Z" fill="#095ABA"/>
                  <path d="M327.55 40.4683C327.55 39.4586 327.194 38.6864 326.481 38.1519C325.768 37.6054 324.485 37.0352 322.632 36.4413C320.779 35.8354 319.312 35.2415 318.231 34.6594C315.285 33.0676 313.812 30.9234 313.812 28.2268C313.812 26.8251 314.204 25.5778 314.988 24.4849C315.784 23.3801 316.918 22.5189 318.391 21.9011C319.876 21.2834 321.539 20.9746 323.38 20.9746C325.233 20.9746 326.885 21.3131 328.334 21.9902C329.783 22.6555 330.906 23.5999 331.702 24.8234C332.509 26.047 332.913 27.4368 332.913 28.993H327.568C327.568 27.8051 327.194 26.8845 326.445 26.2311C325.697 25.5659 324.645 25.2333 323.291 25.2333C321.985 25.2333 320.969 25.5124 320.244 26.0707C319.52 26.6172 319.157 27.3418 319.157 28.2446C319.157 29.0881 319.579 29.7949 320.422 30.3651C321.278 30.9353 322.531 31.4698 324.182 31.9688C327.223 32.8835 329.439 34.0179 330.829 35.3721C332.218 36.7264 332.913 38.4132 332.913 40.4327C332.913 42.6779 332.064 44.4419 330.365 45.7249C328.667 46.9959 326.38 47.6315 323.505 47.6315C321.509 47.6315 319.692 47.2692 318.053 46.5445C316.413 45.808 315.16 44.8042 314.293 43.5332C313.437 42.2621 313.01 40.7891 313.01 39.1141H318.373C318.373 41.977 320.084 43.4084 323.505 43.4084C324.776 43.4084 325.768 43.153 326.481 42.6422C327.194 42.1195 327.55 41.3949 327.55 40.4683Z" fill="#095ABA"/>
                </g>
                <defs>
                  <clipPath id="clip0_288_14_footer_s2">
                    <rect width="350" height="131" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </div>
          </div>
          <p className={corporateTextStyles}>
            A division of Bushers Electronics dedicated to precision hardware interface diagnostics, silicon logic verification, and laboratory tools development.
          </p>
          <span className={style({ font: 'body-xs', color: 'neutral-subdued' })}>
            &copy; 2026 Bushers Electronics. All rights reserved. Registered in Corporate Systems Division.
          </span>
        </div>

        {/* Column 2: Specs index */}
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 8 })}>
          <h4 className={sectionTitleStyles}>
            Technical Resource Index
          </h4>
          <ul className={listStyles}>
            {[
              { label: 'Web Serial API Specification', url: 'https://wicg.github.io/serial/' },
              { label: 'Silicon Labs AN978 Customs Guide', url: 'https://www.silabs.com/documents/public/application-notes/an978-cp210x-usb-to-uart-api-specification.pdf' },
              { label: 'Espressif esptool-js Library', url: 'https://github.com/espressif/esptool-js' },
              { label: 'Device Whitelist & USB Vendor IDs', url: 'https://devicehunt.com/' }
            ].map((link, idx) => (
              <li key={idx} className={style({ margin: 0 })}>
                <Link 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  styles={style({ font: 'body-xs' }) as any}
                >
                  &rarr; {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Platform & Caching Environment Badges */}
        <div className={style({ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'start' })}>
          <h4 className={sectionTitleStyles}>
            Environment Status
          </h4>
          <div className={style({
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'start'
          })}>
            {/* Caching Status */}
            <Badge variant="positive" fillStyle="subtle">
              <DataUploadIcon /> PWA Status: Fully Offline Cached (v1.0.8)
            </Badge>

            {/* Execution Env */}
            <Badge variant="notice" fillStyle="subtle">
              <PluginIcon /> Client: 100% Sandboxed Web Serial
            </Badge>

            {/* Network Online Status */}
            <StatusLight variant={isOnline ? 'positive' : 'negative'}>
              Connection: {isOnline ? 'Online / Operational' : 'Offline / Standalone Mode'}
            </StatusLight>

            <Button
              onPress={async () => {
                try {
                  // 1. Unregister all service workers
                  if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                      await registration.unregister();
                    }
                  }
                  // 2. Clear all caches
                  if ('caches' in window) {
                    const cacheKeys = await caches.keys();
                    for (const key of cacheKeys) {
                      await caches.delete(key);
                    }
                  }
                  // 3. Reload window
                  window.location.reload();
                } catch (err) {
                  console.error('Failed to force update PWA:', err);
                  window.location.reload();
                }
              }}
              variant="secondary"
              styles={style({ marginTop: 8, width: 'full' })}
            >
              <RefreshIcon /> Force Update PWA
            </Button>
          </div>
        </div>
      </div>

      <Divider size="S" />

      {/* Decorative Brand Color Bar */}
      <div className={style({
        display: 'flex',
        height: 4,
        width: '100%',
        borderRadius: 'full',
        overflow: 'hidden',
      })}>
        <div className={style({ flex: '0 0 40%', backgroundColor: 'blue-600' })} />
        <div className={style({ flex: '0 0 35%', backgroundColor: 'yellow-500' })} />
        <div className={style({ flex: '0 0 25%', backgroundColor: 'red-600' })} />
      </div>
    </footer>
  );
};
