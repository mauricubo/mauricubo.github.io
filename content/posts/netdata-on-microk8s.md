---
title: 'Install Netdata on Microk8s'
summary: "Setup Netdata on Microk8s"
description: "Setup Netdata on Microk8s"
author: "Mauricio"
authorAvatarPath: "/images/avatar.jpeg"
date: 2024-01-14
draft: false
toc: true
readTime: true
autonumber: true
math: true
hideBackToTop: false
tags: ['netdata', 'kubernetes', 'microk8s', 'monitoring']
showTags: true
hidePagination: false
---

## Intro

![](/images/post4/Homeimage.png)

This post is a real quick note for myself…

I wanted to install `netdata` to monitoring my homeserver. I think that is the perfect tool for a real time information of your server. When I started to look for the best monitoring tool on the internet, everyone, literally, everyone suggested `grafana` with `prometheus`, which I then tried. I think that it is an amaizing tool with a high potential to do whatever you want, but it was not what I was looking for.

I knew about netdata form using it some years ago but I never used it again so I decided to install it and try again. But this time on my `microk8s` cluster .

[GitHub - netdata/netdata: Real-time performance monitoring, done right!](https://github.com/netdata/netdata)

* * *

## Enable the storage plugin on our microk8s cluster

We need to enable the storage plugin so we can give the default storage class that netdata needs for provisioning the persistence of the database and statistics to the cluster. This step is not necessary on the cloud providers clusters because most of them already have the default storage class configured.

    $ microk8s enable storage
    

## Install netdata usign helm 

As the first step, we are going to install the tool using helm. So we add the repo to the helm repo.

    $ helm repo add netdata https://netdata.github.io/helmchart/
    

We create a special namespace for the monitoring tools and we install netdata.

    $ kubectl create namespace monitoring
    $ helm install netdata netdata/netdata -n monitoring
    

* * *

## Publishing the WebUI 

I have changed the default ingress configuration that comes with the default. You have 2 options to do this, the first one is to download the helm charts and modify the ingress part, or the second one (the one that I used for this configuration) is delete the ingress object and recreate it.

    $ kubectl delete ingress -n monitoring netdata
    

We create the ingress.yaml with this content…

    apiVersion: networking.k8s.io/v1
    kind: Ingress
    metadata:
      name: netdata
      namespace: monitoring
      labels:
        app: netdata
      annotations:
        nginx.ingress.kubernetes.io/rewrite-target: /
    spec:
      ingressClassName: nginx
      rules:
      - host: "<your_domain_name_here>"
        http:
          paths:
          - pathType: Prefix
            path: /
            backend:
              service:
                name: netdata
                port:
                  number: 19999
    

And we create the object

    $ kubectl apply -f ingress.yaml
    

* * *

Finally, we test if we have access to the UI…

