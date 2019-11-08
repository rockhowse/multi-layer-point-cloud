# multi-layer-point cloud

This sample was extracted from a collection of animations created for 2013 Wired Business Conference and showcases some data collected by [Nanex LLC.](https://nanex.net) revealing some market anomalies in the UQDF and CQS quote data feeds leading up to May 6th 2010 `The Flash Crash`

It makes use of WebGL, and [MrDoob's](https://github.com/mrdoob) fantastic `three.js` library. Specifically [release R57](https://github.com/mrdoob/three.js/releases/tag/r57)

## Basic Concept

Each layer is comprized of a 2 dimensional array of numeric data. This data is pulled in and rendered as a single geometry per layer. The pixels are colored using a gradient based on a configurable threshold. The labels are also configurable per/layer and allow for axis and arbitrary positioning of labels.
