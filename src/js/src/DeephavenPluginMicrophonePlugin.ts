import { type WidgetPlugin, PluginType } from '@deephaven/plugin';
import { vsGraph } from '@deephaven/icons';
import { DeephavenPluginMicrophoneView } from './DeephavenPluginMicrophoneView';

// Register the plugin with Deephaven
export const DeephavenPluginMicrophonePlugin: WidgetPlugin = {
  // The name of the plugin
  name: 'deephaven-plugin-microphone',
  // The type of plugin - this will generally be WIDGET_PLUGIN
  type: PluginType.WIDGET_PLUGIN,
  // The supported types for the plugin. This should match the value returned by `name`
  // in DeephavenPluginMicrophoneType in deephaven_plugin_microphone_type.py
  supportedTypes: 'DeephavenPluginMicrophone',
  // The component to render for the plugin
  component: DeephavenPluginMicrophoneView,
  // The icon to display for the plugin
  icon: vsGraph,
};

export default DeephavenPluginMicrophonePlugin;
