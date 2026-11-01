/** The Run workflow form: one field per `workflow_dispatch` input, answered as the strings GitHub takes. */
import { mountButton, mountCheckbox, mountSelect, mountTextField } from '@openchamber/sdk/ui';
import type { DispatchInput } from './github';

export function askInputs(title: string, branch: string, inputs: DispatchInput[]): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    // A boolean without a default is false on GitHub; an empty string would be refused.
    const values: Record<string, string> = Object.fromEntries(
      inputs.map((input) => [input.name, input.type === 'boolean' ? String(input.default === 'true') : input.default]),
    );
    const form = document.createElement('form');
    form.className = 'drawer';
    form.setAttribute('role', 'dialog');
    form.setAttribute('aria-label', title);
    const head = form.appendChild(document.createElement('div'));
    head.className = 'drawer-head';
    const heading = head.appendChild(document.createElement('span'));
    heading.className = 'drawer-title';
    heading.textContent = `${title} on ${branch}`;
    const fields = form.appendChild(document.createElement('div'));
    fields.className = 'drawer-body form-fields';

    const errors = new Map<string, (message: string | undefined) => void>();
    for (const input of inputs) {
      const slot = fields.appendChild(document.createElement('div'));
      const label = `${input.name}${input.required ? ' *' : ''}`;
      const set = (value: string) => (values[input.name] = value);
      if (input.type === 'boolean') {
        mountCheckbox(slot, { label, description: input.description || undefined, checked: input.default === 'true', onChange: (checked) => set(String(checked)) });
      } else if (input.type === 'choice' && input.options.length) {
        if (!input.options.includes(values[input.name])) values[input.name] = input.options[0];
        const select = mountSelect(slot, {
          label,
          value: values[input.name],
          options: input.options.map((option) => ({ id: option, label: option })),
          onChange: (id) => {
            set(id);
            select.update({ value: id });
          },
        });
        if (input.description) slot.appendChild(document.createElement('div')).append(input.description);
      } else {
        const field = mountTextField(slot, {
          label,
          value: input.default,
          helper: input.description || undefined,
          placeholder: input.type === 'number' ? '0' : undefined,
          onChange: (value) => {
            set(value);
            field.update({ error: undefined });
          },
        });
        errors.set(input.name, (error) => field.update({ error }));
      }
    }

    const done = (result: Record<string, string> | null) => {
      document.removeEventListener('keydown', onKey);
      form.remove();
      resolve(result);
    };
    const submit = () => {
      let valid = true;
      for (const input of inputs) {
        const value = values[input.name].trim();
        const error =
          input.required && !value ? 'Required.' : input.type === 'number' && value && !Number.isFinite(Number(value)) ? 'Enter a number.' : undefined;
        errors.get(input.name)?.(error);
        if (error) valid = false;
      }
      // Empty optional inputs are left out, so GitHub applies the workflow's own defaults.
      if (valid) done(Object.fromEntries(Object.entries(values).filter(([, value]) => value.trim() !== '')));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') done(null);
    };
    document.addEventListener('keydown', onKey);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submit();
    });

    const tools = form.appendChild(document.createElement('div'));
    tools.className = 'form-tools';
    mountButton(tools.appendChild(document.createElement('span')), { label: 'Run workflow', onClick: submit });
    mountButton(tools.appendChild(document.createElement('span')), { label: 'Cancel', variant: 'ghost', onClick: () => done(null) });
    document.body.append(form);
    form.querySelector<HTMLElement>('input, button')?.focus();
  });
}
