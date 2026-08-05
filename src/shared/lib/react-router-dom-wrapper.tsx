import {
  useParams as useRealParams,
  useSearchParams as useRealSearchParams,
  useNavigate as useRealNavigate,
  Link as RealLink,
  NavLink as RealNavLink,
  Navigate as RealNavigate,
} from 'react-router-dom-original';
import React, { useMemo, useCallback } from 'react';
import type { URLSearchParamsInit, NavigateOptions, LinkProps, NavLinkProps, NavigateProps } from 'react-router-dom-original';

export * from 'react-router-dom-original';

export function obfuscate(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^\d+$/.test(str)) {
    try {
      return '~' + btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
      return str;
    }
  }
  return str;
}

export function deobfuscate(val: string | null | undefined): string {
  if (!val) return '';
  if (val.startsWith('~')) {
    try {
      const base64Part = val.substring(1);
      let base64 = base64Part.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return atob(base64);
    } catch {
      return val;
    }
  }
  return val;
}

export function encodeUrl(url: any): any {
  if (!url) return url;
  if (typeof url === 'string') {
    try {
      const [pathPart, searchPart] = url.split('?');
      const encodedPath = pathPart
        .split('/')
        .map((segment) => {
          if (/^\d+$/.test(segment)) {
            return obfuscate(segment);
          }
          return segment;
        })
        .join('/');

      if (searchPart) {
        const params = new URLSearchParams(searchPart);
        const encodedParams = new URLSearchParams();
        params.forEach((val, key) => {
          encodedParams.append(key, obfuscate(val));
        });
        return `${encodedPath}?${encodedParams.toString()}`;
      }

      return encodedPath;
    } catch {
      return url;
    }
  }
  return url;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  const params = useRealParams<T>();
  return useMemo(() => {
    const decoded: any = {};
    for (const [key, val] of Object.entries(params)) {
      decoded[key] = deobfuscate(val);
    }
    return decoded as T;
  }, [params]);
}

export function useSearchParams(defaultInit?: URLSearchParamsInit): [URLSearchParams, (nextInit: URLSearchParamsInit | ((prev: URLSearchParams) => URLSearchParamsInit), navigateOpts?: NavigateOptions) => void] {
  const [searchParams, setSearchParams] = useRealSearchParams(defaultInit);

  const decodedParams = useMemo(() => {
    const params = new URLSearchParams();
    searchParams.forEach((val, key) => {
      params.append(key, deobfuscate(val));
    });
    return params;
  }, [searchParams]);

  const setDecodedSearchParams = useCallback(
    (
      nextInit: URLSearchParamsInit | ((prev: URLSearchParams) => URLSearchParamsInit),
      navigateOpts?: NavigateOptions
    ) => {
      let initValue: URLSearchParamsInit;
      if (typeof nextInit === 'function') {
        initValue = nextInit(decodedParams);
      } else {
        initValue = nextInit;
      }

      const newParams = new URLSearchParams(initValue as any);
      const encodedParams = new URLSearchParams();
      newParams.forEach((val, key) => {
        encodedParams.append(key, obfuscate(val));
      });

      setSearchParams(encodedParams, navigateOpts);
    },
    [decodedParams, setSearchParams]
  );

  return [decodedParams, setDecodedSearchParams];
}

export function useNavigate() {
  const navigate = useRealNavigate();
  return useCallback(
    (to: any, options?: NavigateOptions) => {
      if (typeof to === 'string') {
        navigate(encodeUrl(to), options);
      } else if (typeof to === 'number') {
        navigate(to);
      } else if (to && typeof to === 'object' && 'pathname' in to) {
        navigate(
          {
            ...to,
            pathname: to.pathname ? encodeUrl(to.pathname) : undefined,
            search: to.search ? encodeUrl(to.search) : undefined,
          },
          options
        );
      } else {
        navigate(to, options);
      }
    },
    [navigate]
  );
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(({ to, ...props }, ref) => {
  const encodedTo = useMemo(() => {
    if (typeof to === 'string') {
      return encodeUrl(to);
    } else if (to && typeof to === 'object' && 'pathname' in to) {
      return {
        ...to,
        pathname: to.pathname ? encodeUrl(to.pathname) : undefined,
        search: to.search ? encodeUrl(to.search) : undefined,
      };
    }
    return to;
  }, [to]);

  return <RealLink {...props} to={encodedTo} ref={ref} />;
});
Link.displayName = 'Link';

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ to, ...props }, ref) => {
  const encodedTo = useMemo(() => {
    if (typeof to === 'string') {
      return encodeUrl(to);
    } else if (to && typeof to === 'object' && 'pathname' in to) {
      return {
        ...to,
        pathname: to.pathname ? encodeUrl(to.pathname) : undefined,
        search: to.search ? encodeUrl(to.search) : undefined,
      };
    }
    return to;
  }, [to]);

  return <RealNavLink {...props} to={encodedTo} ref={ref} />;
});
NavLink.displayName = 'NavLink';

export function Navigate({ to, ...props }: NavigateProps) {
  const encodedTo = useMemo(() => {
    if (typeof to === 'string') {
      return encodeUrl(to);
    } else if (to && typeof to === 'object' && 'pathname' in to) {
      return {
        ...to,
        pathname: to.pathname ? encodeUrl(to.pathname) : undefined,
        search: to.search ? encodeUrl(to.search) : undefined,
      };
    }
    return to;
  }, [to]);

  return <RealNavigate {...props} to={encodedTo} />;
}
