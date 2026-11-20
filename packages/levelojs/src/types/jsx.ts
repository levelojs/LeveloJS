// src/types/jsx.ts - Complete Type Definition Architecture for Levelo JS

export type Reactive<T> = T | (() => T);

export type CSSProperties = {
  [K in keyof CSSStyleDeclaration]?: Reactive<CSSStyleDeclaration[K] | number>;
} & {
  [customProperty: `--${string}`]: Reactive<string | number>;
};

declare global {
  function h(tag: any, props?: Record<string, any> | null, ...children: any[]): any;
  function Fragment(props: { children?: any }): any;

  namespace JSX {
    type Element = Node | any;

    export interface ElementAttributesProperty {
      props: {};
    }
    export interface ElementChildrenAttribute {
      children: {};
    }

    export interface DOMEvents {
      onClick?: (e: MouseEvent) => void;
      onDblClick?: (e: MouseEvent) => void;
      onMouseDown?: (e: MouseEvent) => void;
      onMouseUp?: (e: MouseEvent) => void;
      onMouseMove?: (e: MouseEvent) => void;
      onMouseEnter?: (e: MouseEvent) => void;
      onMouseLeave?: (e: MouseEvent) => void;
      onKeyDown?: (e: KeyboardEvent) => void;
      onKeyUp?: (e: KeyboardEvent) => void;
      onKeyPress?: (e: KeyboardEvent) => void;
      onFocus?: (e: FocusEvent) => void;
      onBlur?: (e: FocusEvent) => void;
      onSubmit?: (e: SubmitEvent) => void;
      onInput?: (e: InputEvent) => void;
      onChange?: (e: Event) => void;
      onScroll?: (e: Event) => void;
      onTouchStart?: (e: TouchEvent) => void;
      onTouchMove?: (e: TouchEvent) => void;
      onTouchEnd?: (e: TouchEvent) => void;
    }

    export interface HTMLAttributes extends DOMEvents {
      class?: string | undefined;
      className?: string | undefined;
      id?: string | undefined;
      style?: Reactive<CSSProperties | string>;
      renderString?: Reactive<string>;
      title?: Reactive<string>;
      dir?: Reactive<'ltr' | 'rtl' | 'auto'>;
      lang?: Reactive<string>;
      hidden?: Reactive<boolean>;
      tabIndex?: Reactive<number>;
      role?: Reactive<string>;
      children?: any;
      [dataAttr: `data-${string}`]: Reactive<string | number | boolean | undefined>;
      [ariaAttr: `aria-${string}`]: Reactive<string | number | boolean | undefined>;
    }

    export interface MetaHTMLAttributes extends HTMLAttributes {
      charset?: string;
      charSet?: string;
      content?: Reactive<string>;
      httpEquiv?: string;
      'http-equiv'?: string;
      media?: string;
      name?: string;
      property?: string;
    }

    export interface LinkHTMLAttributes extends HTMLAttributes {
      as?: string;
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      crossorigin?: 'anonymous' | 'use-credentials' | '';
      href?: Reactive<string>;
      hrefLang?: string;
      integrity?: string;
      media?: string;
      rel?: string;
      sizes?: string;
      type?: string;
    }

    export interface ScriptHTMLAttributes extends HTMLAttributes {
      async?: boolean;
      crossOrigin?: 'anonymous' | 'use-credentials' | '';
      defer?: boolean;
      integrity?: string;
      noModule?: boolean;
      src?: Reactive<string>;
      type?: string;
    }

    export interface AnchorHTMLAttributes extends HTMLAttributes {
      href?: string | undefined;
      target?: Reactive<'_blank' | '_self' | '_parent' | '_top'>;
      download?: Reactive<any>;
      rel?: string | undefined;
    }

    export interface ButtonHTMLAttributes extends HTMLAttributes {
      type?: Reactive<'button' | 'submit' | 'reset'>;
      disabled?: Reactive<boolean>;
      name?: Reactive<string>;
      value?: Reactive<string | number>;
    }

    export interface FormHTMLAttributes extends HTMLAttributes {
      action?: Reactive<string>;
      method?: Reactive<'get' | 'post'>;
      target?: Reactive<string>;
    }

    export interface InputHTMLAttributes extends HTMLAttributes {
      type?: Reactive<string>;
      value?: Reactive<string | number | boolean>;
      placeholder?: string | undefined;
      checked?: Reactive<boolean>;
      disabled?: Reactive<boolean>;
      readOnly?: Reactive<boolean>;
      required?: Reactive<boolean>;
      name?: Reactive<string>;
      min?: Reactive<string | number>;
      max?: Reactive<string | number>;
      step?: Reactive<string | number>;
      maxLength?: Reactive<number>;
      minLength?: Reactive<number>;
      pattern?: Reactive<string>;
      autocomplete?: Reactive<string>;
    }

    export interface TextAreaHTMLAttributes extends HTMLAttributes {
      value?: Reactive<string | number>;
      placeholder?: Reactive<string>;
      rows?: Reactive<number>;
      cols?: Reactive<number>;
      disabled?: Reactive<boolean>;
      readOnly?: Reactive<boolean>;
      required?: Reactive<boolean>;
    }

    export interface SelectHTMLAttributes extends HTMLAttributes {
      value?: Reactive<string | number | string[]>;
      disabled?: Reactive<boolean>;
      multiple?: Reactive<boolean>;
      name?: Reactive<string>;
      required?: Reactive<boolean>;
    }

    export interface OptionHTMLAttributes extends HTMLAttributes {
      value?: Reactive<string | number>;
      selected?: Reactive<boolean>;
      disabled?: Reactive<boolean>;
    }

    export interface ImgHTMLAttributes extends HTMLAttributes {
      src?: Reactive<string>;
      alt?: Reactive<string>;
      width?: Reactive<number | string>;
      height?: Reactive<number | string>;
      loading?: Reactive<'eager' | 'lazy'>;
      decoding?: Reactive<'sync' | 'async' | 'auto'>;
    }

    export interface SVGAttributes extends HTMLAttributes {
      xmlns?: string;
      viewBox?: Reactive<string>;
      fill?: Reactive<string>;
      stroke?: Reactive<string>;
      strokeWidth?: Reactive<number | string>;
      strokeLinecap?: Reactive<'butt' | 'round' | 'square' | 'inherit'>;
      strokeLinejoin?: Reactive<'miter' | 'round' | 'bevel' | 'inherit'>;
      width?: Reactive<number | string>;
      height?: Reactive<number | string>;
      d?: Reactive<string>;
      cx?: Reactive<number | string>;
      cy?: Reactive<number | string>;
      r?: Reactive<number | string>;
      x?: Reactive<number | string>;
      y?: Reactive<number | string>;
      gradientTransform?: Reactive<string>;
      gradientUnits?: Reactive<string>;
      patternUnits?: Reactive<string>;
    }

    export interface IntrinsicElements {
      /* DOCUMENT / METADATA */
      html: HTMLAttributes;
      head: HTMLAttributes;
      body: HTMLAttributes;
      base: { href?: string; target?: string } & HTMLAttributes;
      link: LinkHTMLAttributes;
      meta: MetaHTMLAttributes;
      script: ScriptHTMLAttributes;
      style: HTMLAttributes;
      title: HTMLAttributes;

      /* SEMANTIC */
      address: HTMLAttributes;
      article: HTMLAttributes;
      aside: HTMLAttributes;
      footer: HTMLAttributes;
      header: HTMLAttributes;
      h1: HTMLAttributes;
      h2: HTMLAttributes;
      h3: HTMLAttributes;
      h4: HTMLAttributes;
      h5: HTMLAttributes;
      h6: HTMLAttributes;
      main: HTMLAttributes;
      nav: HTMLAttributes;
      section: HTMLAttributes;
      search: HTMLAttributes;

      /* TEXT / INLINE */
      a: AnchorHTMLAttributes;
      abbr: HTMLAttributes;
      b: HTMLAttributes;
      bdi: HTMLAttributes;
      bdo: HTMLAttributes;
      br: HTMLAttributes;
      cite: HTMLAttributes;
      code: HTMLAttributes;
      data: HTMLAttributes;
      del: HTMLAttributes;
      dfn: HTMLAttributes;
      em: HTMLAttributes;
      i: HTMLAttributes;
      ins: HTMLAttributes;
      kbd: HTMLAttributes;
      mark: HTMLAttributes;
      q: HTMLAttributes;
      rp: HTMLAttributes;
      rt: HTMLAttributes;
      ruby: HTMLAttributes;
      s: HTMLAttributes;
      samp: HTMLAttributes;
      small: HTMLAttributes;
      span: HTMLAttributes;
      strong: HTMLAttributes;
      sub: HTMLAttributes;
      sup: HTMLAttributes;
      time: HTMLAttributes;
      u: HTMLAttributes;
      var: HTMLAttributes;
      wbr: HTMLAttributes;

      /* BLOCK / CONTENT */
      blockquote: HTMLAttributes;
      div: HTMLAttributes;
      figure: HTMLAttributes;
      figcaption: HTMLAttributes;
      hr: HTMLAttributes;
      p: HTMLAttributes;
      pre: HTMLAttributes;

      /* LISTS */
      dl: HTMLAttributes;
      dt: HTMLAttributes;
      dd: HTMLAttributes;
      ol: HTMLAttributes;
      ul: HTMLAttributes;
      li: HTMLAttributes;

      /* TABLES */
      table: HTMLAttributes;
      caption: HTMLAttributes;
      colgroup: HTMLAttributes;
      col: HTMLAttributes;
      thead: HTMLAttributes;
      tbody: HTMLAttributes;
      tfoot: HTMLAttributes;
      tr: HTMLAttributes;
      th: HTMLAttributes;
      td: HTMLAttributes;

      /* FORMS */
      form: FormHTMLAttributes;
      fieldset: HTMLAttributes;
      legend: HTMLAttributes;
      label: HTMLAttributes;
      input: InputHTMLAttributes;
      button: ButtonHTMLAttributes;
      select: SelectHTMLAttributes;
      option: OptionHTMLAttributes;
      optgroup: HTMLAttributes;
      textarea: TextAreaHTMLAttributes;
      datalist: HTMLAttributes;
      output: HTMLAttributes;
      meter: HTMLAttributes;
      progress: HTMLAttributes;

      /* MEDIA */
      audio: HTMLAttributes;
      video: HTMLAttributes;
      source: HTMLAttributes;
      track: HTMLAttributes;
      img: ImgHTMLAttributes;
      picture: HTMLAttributes;
      iframe: HTMLAttributes;
      embed: HTMLAttributes;
      object: HTMLAttributes;
      param: HTMLAttributes;

      /* INTERACTIVE */
      details: HTMLAttributes;
      summary: HTMLAttributes;
      dialog: HTMLAttributes;

      /* GRAPHICS & SVG */
      canvas: HTMLAttributes;
      svg: SVGAttributes;
      g: SVGAttributes;
      path: SVGAttributes;
      circle: SVGAttributes;
      ellipse: SVGAttributes;
      rect: SVGAttributes;
      line: SVGAttributes;
      polyline: SVGAttributes;
      polygon: SVGAttributes;
      defs: SVGAttributes;
      use: SVGAttributes;
      text: SVGAttributes;
      tspan: SVGAttributes;
      desc: SVGAttributes;
      symbol: SVGAttributes;
      marker: SVGAttributes;
      clipPath: SVGAttributes;
      mask: SVGAttributes;
      pattern: SVGAttributes;
      linearGradient: SVGAttributes;
      radialGradient: SVGAttributes;
      stop: SVGAttributes;
      filter: SVGAttributes;
      feBlend: SVGAttributes;
      feColorMatrix: SVGAttributes;
      feComponentTransfer: SVGAttributes;
      feComposite: SVGAttributes;
      feConvolveMatrix: SVGAttributes;
      feDiffuseLighting: SVGAttributes;
      feDisplacementMap: SVGAttributes;
      feDistantLight: SVGAttributes;
      feDropShadow: SVGAttributes;
      feFlood: SVGAttributes;
      feFuncA: SVGAttributes;
      feFuncB: SVGAttributes;
      feFuncG: SVGAttributes;
      feFuncR: SVGAttributes;
      feGaussianBlur: SVGAttributes;
      feImage: SVGAttributes;
      feMerge: SVGAttributes;
      feMergeNode: SVGAttributes;
      feMorphology: SVGAttributes;
      feOffset: SVGAttributes;
      fePointLight: SVGAttributes;
      feSpecularLighting: SVGAttributes;
      feSpotLight: SVGAttributes;
      feTile: SVGAttributes;
      feTurbulence: SVGAttributes;

      /* MATHML */
      math: HTMLAttributes;
      mi: HTMLAttributes;
      mn: HTMLAttributes;
      mo: HTMLAttributes;
      ms: HTMLAttributes;
      mspace: HTMLAttributes;
      mtext: HTMLAttributes;
      annotation: HTMLAttributes;
      semantics: HTMLAttributes;

      /* CUSTOM ELEMENTS */
      [elemName: string]: HTMLAttributes;
    }
  }
}

export type JSX = {
  Element: JSX.Element;
  IntrinsicElements: JSX.IntrinsicElements;
  HTMLAttributes: JSX.HTMLAttributes;
  DOMEvents: JSX.DOMEvents;
};
