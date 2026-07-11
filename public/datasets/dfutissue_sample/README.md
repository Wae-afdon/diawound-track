# DiaWound Track DFUTissue Sample Preview

This folder previously held a local testing subset of the DFUTissueSegNet / DFUTissue Dataset for the DiaWound Track mobile UX prototype.

The active Real Dataset Preview Mode now uses 5 remote raw GitHub test images configured in `src/data/dfutissueSample.ts`. The app intentionally loads those images from GitHub URLs first, so the UI can be tested without maintaining local image copies.

Source repository: https://github.com/uwm-bigdata/DFUTissueSegNet  
Paper: https://arxiv.org/abs/2406.16012

## Active Preview Subset

- Target size: 5 real test images.
- Image source: `DFUTissue/Labeled/Original/Images/Test`.
- Mask paths are prepared from `DFUTissue/Labeled/Original/Annotations/Test`, but mask parsing is not implemented yet.
- Tissue labels display as `label pending` until mask parsing is added.

The selected IDs are:

- Test: 0914, 0925, 0927, 0935, 0961

## Label Handling

The palette file in the source dataset maps:

- Red: fibrin
- Green: granulation
- Blue: callus

DiaWound Track does not claim doctor-confirmed Phase 1-5 labels for DFUTissue images. Any Phase 1-5 value shown for these five images is a derived prototype phase for flow testing only, not a real diagnosis.

## Manual Replacement

To replace or extend this subset, update `src/data/dfutissueSample.ts` with the intended raw GitHub image URLs, matching mask URLs, split names, and parsed tissue labels when mask parsing is available.
