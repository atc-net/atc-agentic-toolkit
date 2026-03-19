# Control Catalog

Full inventory of 160+ controls organized by category and tier.

---

## Tier 1: Base (Atc.Wpf)

### Layout Panels

| Control | Description |
|---|---|
| `GridEx` | Enhanced Grid with simplified row/column definitions |
| `AutoGrid` | Auto-layout grid that arranges children automatically |
| `FlexPanel` | CSS Flexbox-inspired layout panel |
| `StaggeredPanel` | Masonry/staggered layout for variable-height items |
| `UniformSpacingPanel` | Equal spacing between children |
| `ResponsivePanel` | Adapts layout based on available width |
| `DockPanelPro` | Enhanced DockPanel with additional features |

### MVVM Components

| Component | Description |
|---|---|
| `ViewModelBase` | Base ViewModel with INotifyPropertyChanged, validation, built-in properties |
| `ObservableObject` | Lightweight INotifyPropertyChanged base |
| `RelayCommand` / `RelayCommand<T>` | Synchronous commands with CanExecute |
| `RelayCommandAsync` / `RelayCommandAsync<T>` | Async commands with cancellation |

---

## Tier 2: Controls (Atc.Wpf.Controls)

### Input Controls

| Control | Description |
|---|---|
| `NumericBox` | Generic numeric input with validation |
| `IntegerBox` | Integer-only input with up/down buttons |
| `DecimalBox` | Decimal input with precision control |
| `CurrencyBox` | Currency-formatted numeric input |
| `ToggleSwitch` | On/off toggle control |
| `RangeSlider` | Dual-thumb range selection slider |
| `Rating` | Star rating control |
| `FilePicker` | File selection with browse button |
| `DirectoryPicker` | Directory selection with browse button |

### Button Controls

| Control | Description |
|---|---|
| `ImageButton` | Button with image/icon support |
| `SplitButton` | Button with dropdown menu |
| `AuthenticationButton` | Login/logout state button |
| `ConnectivityButton` | Connect/disconnect state button |

### Color Controls

| Control | Description |
|---|---|
| `HueSlider` | Hue selection slider (0-360) |
| `SaturationBrightnessPicker` | 2D saturation/brightness picker |
| `TransparencySlider` | Alpha/transparency slider |
| `WellKnownColorPicker` | Predefined color selection |

### Data Display

| Control | Description |
|---|---|
| `Alert` | Alert/notification banner (Info, Warning, Error, Success) |
| `Card` | Material-style content card |
| `Badge` | Numeric or dot badge overlay |
| `Chip` | Tag/chip with optional close button |
| `Avatar` | User avatar (image, initials, icon) |
| `AvatarGroup` | Grouped avatars with overflow indicator |
| `Divider` | Horizontal/vertical separator with optional label |
| `Carousel` | Image/content carousel with navigation |
| `Breadcrumb` | Navigation breadcrumb trail |
| `Stepper` | Step-by-step progress indicator |
| `Segmented` | Segmented button group |
| `Timeline` | Vertical timeline display |
| `Popover` | Popup content on hover/click |

### Progress & Loading

| Control | Description |
|---|---|
| `BusyOverlay` | Semi-transparent busy indicator overlay |
| `LoadingIndicator` | Animated loading spinner |
| `Overlay` | Content overlay with dimming |
| `Skeleton` | Placeholder skeleton loading animation |

### Selectors

| Control | Description |
|---|---|
| `CountrySelector` | Country selection with flags |
| `LanguageSelector` | Language/culture selection |
| `FontFamilySelector` | System font selection |

### Drag & Drop

| Control | Description |
|---|---|
| `DragDropAttach` | Attached behavior for drag-and-drop operations |

---

## Tier 3: Forms (Atc.Wpf.Forms)

All form controls include: built-in label, validation support, consistent styling, and deferred validation pattern.

### Labeled Form Controls (25+)

| Control | Input Type |
|---|---|
| `LabelTextBox` | Single-line text |
| `LabelTextBoxSearch` | Text with search icon |
| `LabelRichTextBox` | Multi-line rich text |
| `LabelIntegerBox` | Integer with validation |
| `LabelDecimalBox` | Decimal with validation |
| `LabelCurrencyBox` | Currency-formatted input |
| `LabelComboBox` | Dropdown selection |
| `LabelEditableComboBox` | Editable dropdown |
| `LabelDatePicker` | Date selection |
| `LabelTimePicker` | Time selection |
| `LabelDateTimePicker` | Date + time selection |
| `LabelToggleSwitch` | On/off toggle |
| `LabelCheckBox` | Checkbox with label |
| `LabelSlider` | Range slider |
| `LabelProgressBar` | Progress indicator |
| `LabelColorPicker` | Color selection |
| `LabelFilePicker` | File browse |
| `LabelDirectoryPicker` | Directory browse |
| `LabelCountrySelector` | Country with flags |
| `LabelLanguageSelector` | Language/culture |
| `LabelFontFamilySelector` | Font selection |
| `LabelPixelSizeSelector` | Pixel size |
| `LabelWellKnownColorSelector` | Named colors |
| `LabelContentControl` | Custom content with label |

### Usage Pattern

```xml
<forms:LabelTextBox
    LabelText="Full Name"
    Value="{Binding FullName, Mode=TwoWay}"
    IsMandatory="True"
    ValidationText="Name is required" />

<forms:LabelComboBox
    LabelText="Status"
    SelectedItem="{Binding SelectedStatus}"
    ItemsSource="{Binding Statuses}" />

<forms:LabelDatePicker
    LabelText="Birth Date"
    Value="{Binding BirthDate}" />
```

---

## Tier 4: Components (Atc.Wpf.Components)

### Dialogs

| Component | Description |
|---|---|
| `InfoDialogBox` | Information message dialog |
| `QuestionDialogBox` | Yes/No/Cancel question dialog |
| `InputDialogBox` | Single text input dialog |
| `InputFormDialogBox` | Multi-field form dialog |
| `ColorPickerDialogBox` | Full color picker dialog |
| `BasicApplicationSettingsDialogBox` | App settings dialog (theme, accent color) |

### Viewers

| Component | Description |
|---|---|
| `JsonViewer` | JSON tree viewer with syntax highlighting |
| `TerminalViewer` | Terminal/console output viewer |

### Flyouts

| Component | Description |
|---|---|
| `Flyout` | Slide-in panel from edge |
| `FlyoutHost` | Container for flyout panels |
| `FlyoutService` | Service for programmatic flyout management |

### Notifications

| Component | Description |
|---|---|
| `ToastNotification` | Toast notification popup |
| `ToastNotificationManager` | Manages toast queue and display |
| `IToastNotificationService` | DI service interface |

### Printing

| Component | Description |
|---|---|
| `PrintPreviewWindow` | Print preview dialog |
| `IPrintService` | DI service for printing |

### Undo/Redo

| Component | Description |
|---|---|
| `UndoRedoHistoryView` | Visual undo/redo history |
| `IUndoRedoService` | DI service for undo/redo |

### Selectors

| Component | Description |
|---|---|
| `DualListSelector` | Two-list item transfer control |

---

## Atc.Wpf.Network

| Control | Description |
|---|---|
| `NetworkScannerView` | IP scanning, port scanning, device discovery |

Requires `Atc.Network` and `Atc.Wpf.Network` packages.
