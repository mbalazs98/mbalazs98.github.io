---
layout: distill
title: Efficient event-based delay learning
giscus_comments: false
date: 2025-10-24
featured: true
mermaid:
  enabled: true
  zoomable: true
code_diff: true
map: true
chart:
  chartjs: true
  echarts: true
  vega_lite: true
tikzjax: true
typograms: true

authors:
  - name: Balázs Mészáros
  - name: James C. Knight
  - name: Jonathan Timcheck
  - name: Thomas Nowotny

bibliography: 2025-10-25-deventprop.bib

# Optionally, you can add a table of contents to your post.
# NOTES:
#   - make sure that TOC names match the actual section names
#     for hyperlinks within the post to work correctly.
#   - we may want to automate TOC generation in the future using
#     jekyll-toc plugin (https://github.com/toshimaru/jekyll-toc).
toc:
  - name: Myelination
  - name: Delay learning
  - name: Results

# Below is an example of injecting additional post-specific styles.
# If you use this post as a template, delete this _styles block.
_styles: >
  .fake-img {
    background: #bbb;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 0px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 12px;
  }
  .fake-img p {
    font-family: monospace;
    color: white;
    text-align: left;
    margin: 12px 0;
    text-align: center;
    font-size: 16px;
  }
---

## Myelination
The brain enables the organism to learn and change behavior to an ever-changing environement. Most studies try to understand the underpinnings of plasticy through synaptic weight changes. Myelin however is also plastic and there has been experimental evidence that shows that similary to synaptic strength, it is modulated by neuron activity<d-cite key="bonetto2021myelin"></d-cite>. A great example of the benefit having a diverse set of delays in a network is that sequence detection can be done in quite simple circuits<d-cite key="izhikevich2006polychronization"></d-cite>.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/polychronization.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

How could we study the benefits of myelin plascitcity in artificial neural networks? One option is introducing optimiseable delays in Spiking Neural Networks. 

## Delay learning
We are the not the first to be interested in employing such mechanisms into machine learning setups. There has been a recent upsurge in interest since Hammouamri et. al.<d-cite key="hammouamrilearning"></d-cite> achieved SOTA results on spiking benchmarks after introducing temporal 1D dilated convolutions with learnable spacings (DCLS) as a delay learning algorithm. 

A major drawback to their method lies in the ammeanability for neuromorphic hardware. While for inference discretising the whole network is not necessarily an issue, for training every timestep needs to be stored in the memory, which limits both networks size and temporal precisions and/or sequence length. This is an issue that is general to backpropagation through time (BPTT). 

<d-cite key="wunderlich2021event"></d-cite> proposed to stay in continous time before calculating gradients, and <d-cite key="nowotny2025loss"></d-cite> showed how this could be scaled up for temporall more complex tasks. Recently, it has been even implemented on the SpINNaker hardware <d-cite key="bena2024event"></d-cite>. This is thanks to the backward propagation having essentially identical computational/memory requirements as the backward pass. It seems like the perfect framework to introduce delays in!

## Results

After extensive calculations <d-cite key="meszaros2025efficient"></d-cite>, we end up with a similarly efficient delay learning update. Relying on the same ordinary differential equations, we can apply both synaptic weight and delay gradients, by sampling the correct terms only at spike times. We end up with a delay learning algorithm that for the first time allows for recurrent connections! 

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/deventprop.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>


We test our implementations on the Yin-yang, Spiking Heidelberg Digits, Spiking Speech Commands, and Braille letter reading datasets. We find the delays are always a useful addition, and interestingly, they become particularly useful in small recurrent networks. With the correct implementations this method becomes significantly more efficient than discretisaiton (i.e BPTT) based methods. With fixed network sizes and maximum delay timesteps, we outperform the DCLS based method both in terms of memory requirements in speed.


<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/deventprop_results.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

We also tested our method on Loihi 2 for inference<d-cite key="meszaros2025complete"></d-cite>. For this, we had to quantise our methods and limit our maximum delay timesteps. While this lead to a slight performance decrease, in terms of energy usage, Loihi 2 significantly outperforms GPU based implementaitons even with delays.



<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.liquid loading="eager" path="assets/img/loihi_results.jpg" class="img-fluid rounded z-depth-1" %}
    </div>
</div>
